import 'dotenv/config';

export type GoogleEnvironment = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sessionSecret: string;
};

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

export function getGoogleEnvironment(): GoogleEnvironment {
  return {
    clientId: requiredEnvironmentValue('GOOGLE_CLIENT_ID'),
    clientSecret: requiredEnvironmentValue('GOOGLE_CLIENT_SECRET'),
    redirectUri: requiredEnvironmentValue('GOOGLE_REDIRECT_URI'),
    sessionSecret: requiredEnvironmentValue('AUTH_SESSION_SECRET'),
  };
}
