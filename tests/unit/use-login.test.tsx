import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_MESSAGES } from "~/features/auth/auth-messages";
import { useAuthStore } from "~/features/auth/auth-store";
import { useLogin } from "~/features/auth/use-login";
import { useLogout } from "~/features/auth/use-logout";

const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), navigate: vi.fn(), enqueueSnackbar: vi.fn() }));
vi.mock("~/features/auth/auth-service", () => ({ authenticate: mocks.authenticate }));
vi.mock("react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("notistack", () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }));
// Use the real store with test storage: the application's safe storage remembers
// failures for its lifetime, which would otherwise leak between independent tests.
vi.mock("~/features/auth/auth-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/features/auth/auth-store")>();
  return { ...actual, useAuthStore: actual.createAuthStore(localStorage) };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function LoginHarness() {
  const { form, onSubmit, phase, errorMessage, retryHome } = useLogin();
  return <form onSubmit={onSubmit} aria-label="login">
    <input aria-label="username" {...form.register("username")} disabled={phase !== "idle"} />
    <input aria-label="password" {...form.register("password")} disabled={phase !== "idle"} />
    <button disabled={phase !== "idle"}>submit</button>
    <button type="button" onClick={retryHome}>retry</button>
    <output data-testid="phase">{phase}</output>
    <output data-testid="error">{errorMessage}</output>
    <output>{form.formState.errors.username?.message}</output>
    <output>{form.formState.errors.password?.message}</output>
  </form>;
}

function fillAndSubmit(password = "admin123456Aa@") {
  fireEvent.change(screen.getByLabelText("username"), { target: { value: " admin " } });
  fireEvent.change(screen.getByLabelText("password"), { target: { value: password } });
  fireEvent.submit(screen.getByRole("form"));
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.setState({ user: null, hydrated: true, storageError: false });
  mocks.authenticate.mockResolvedValue({ username: "admin" });
  mocks.navigate.mockResolvedValue(undefined);
});

describe("useLogin", () => {
  it("validates empty form without starting authentication and focuses first error", async () => {
    render(<LoginHarness />);
    fireEvent.submit(screen.getByRole("form"));
    await screen.findByText(AUTH_MESSAGES.usernameRequired);
    expect(screen.getByText(AUTH_MESSAGES.passwordRequired)).toBeInTheDocument();
    expect(mocks.authenticate).not.toHaveBeenCalled();
    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
    expect(screen.getByLabelText("username")).toHaveFocus();
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(AUTH_MESSAGES.invalidForm, expect.objectContaining({ variant: "error", autoHideDuration: 6000 }));
  });

  it("locks repeated submits across authentication and navigation, saves and notifies once", async () => {
    const auth = deferred<{ username: "admin" } | null>();
    const navigation = deferred<void>();
    mocks.authenticate.mockReturnValue(auth.promise);
    mocks.navigate.mockReturnValue(navigation.promise);
    const signIn = vi.spyOn(useAuthStore.getState(), "signIn");
    render(<LoginHarness />);
    fillAndSubmit();
    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => expect(mocks.authenticate).toHaveBeenCalledTimes(1));
    expect(mocks.authenticate).toHaveBeenCalledWith({ username: "admin", password: "admin123456Aa@" });
    expect(screen.getByTestId("phase")).toHaveTextContent("submitting");
    expect(screen.getByLabelText("password")).toBeDisabled();
    await act(async () => { auth.resolve({ username: "admin" }); });
    expect(screen.getByTestId("phase")).toHaveTextContent("redirecting");
    fireEvent.submit(screen.getByRole("form"));
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(mocks.enqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(AUTH_MESSAGES.loginSuccess, expect.objectContaining({ variant: "success", autoHideDuration: 4000 }));
    expect(mocks.navigate).toHaveBeenCalledWith("/home", { replace: true });
    await act(async () => { navigation.resolve(); });
    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
    expect(mocks.authenticate).toHaveBeenCalledTimes(1);
  });

  it("keeps username, clears and focuses password for wrong credentials, then permits a successful retry", async () => {
    mocks.authenticate.mockResolvedValueOnce(null);
    render(<LoginHarness />);
    fillAndSubmit("wrong");
    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent(AUTH_MESSAGES.invalidCredentials));
    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
    expect(screen.getByLabelText("username")).toHaveValue(" admin ");
    expect(screen.getByLabelText("password")).toHaveValue("");
    await waitFor(() => expect(screen.getByLabelText("password")).toHaveFocus());
    expect(useAuthStore.getState().user).toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("password"), { target: { value: "admin123456Aa@" } });
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().user).toEqual({ username: "admin" });
  });

  it("ends pending with safe generic feedback when authentication rejects", async () => {
    mocks.authenticate.mockRejectedValue(new Error("technical secret"));
    render(<LoginHarness />);
    fillAndSubmit();
    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent(AUTH_MESSAGES.loginError));
    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
    expect(useAuthStore.getState().user).toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("keeps the session on failed navigation and retries without reauthenticating", async () => {
    mocks.navigate.mockRejectedValueOnce(new Error("route unavailable"));
    render(<LoginHarness />);
    fillAndSubmit();
    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent(AUTH_MESSAGES.navigationError));
    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
    expect(useAuthStore.getState().user).toEqual({ username: "admin" });
    const retry = deferred<void>();
    mocks.navigate.mockReturnValueOnce(retry.promise);
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(screen.getByTestId("phase")).toHaveTextContent("redirecting");
    expect(mocks.navigate).toHaveBeenCalledTimes(2);
    await act(async () => { retry.resolve(); });
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
    expect(mocks.authenticate).toHaveBeenCalledTimes(1);
  });

  it("uses only a warning when session persistence fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<LoginHarness />);
    fillAndSubmit();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().user).toEqual({ username: "admin" });
    expect(mocks.enqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(AUTH_MESSAGES.persistenceWarning, expect.objectContaining({ variant: "warning", autoHideDuration: 6000 }));
  });
});

describe("useLogout", () => {
  function LogoutHarness() {
    const { logout, isPending } = useLogout();
    return <button onClick={logout} disabled={isPending}>{isPending ? "pending" : "logout"}</button>;
  }

  it("clears the session, writes null, and blocks repeats until navigation completes", async () => {
    useAuthStore.getState().signIn({ username: "admin" });
    const navigation = deferred<void>();
    mocks.navigate.mockReturnValue(navigation.promise);
    render(<LogoutHarness />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(useAuthStore.getState().user).toBeNull();
    expect(JSON.parse(localStorage.getItem("auth-session")!).state.user).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith("/login", { replace: true });
    expect(screen.getByRole("button")).toBeDisabled();
    await act(async () => { navigation.resolve(); });
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("clears memory and shows warning only if storage cannot record logout", async () => {
    useAuthStore.getState().signIn({ username: "admin" });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<LogoutHarness />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(useAuthStore.getState().user).toBeNull();
    expect(mocks.enqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ variant: "warning" }));
  });

  it("keeps the session cleared and releases pending when logout navigation fails", async () => {
    useAuthStore.getState().signIn({ username: "admin" });
    mocks.navigate.mockRejectedValueOnce(new Error("route unavailable"));
    render(<LogoutHarness />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(useAuthStore.getState().user).toBeNull();
    expect(mocks.enqueueSnackbar).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ variant: "error" }));
  });
});
