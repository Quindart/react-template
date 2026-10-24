export type CityGrdpRecord = {
  id: string;
  name: string;
  shortName: string;
  growth: number;
  growthByYear: Record<2024 | 2025, number>;
  latitude: number;
  longitude: number;
  color: string;
};

export const cityGrdp: CityGrdpRecord[] = [
  {
    id: 'hanoi',
    name: 'Hà Nội',
    shortName: 'Hà Nội',
    growth: 8.16,
    growthByYear: { 2024: 6.52, 2025: 8.16 },
    latitude: 21.0285,
    longitude: 105.8542,
    color: '#60a5fa',
  },
  {
    id: 'ho-chi-minh',
    name: 'Thành phố Hồ Chí Minh',
    shortName: 'TP. Hồ Chí Minh',
    growth: 7.53,
    growthByYear: { 2024: 7.17, 2025: 7.53 },
    latitude: 10.8231,
    longitude: 106.6297,
    color: '#a78bfa',
  },
  {
    id: 'hai-phong',
    name: 'Hải Phòng',
    shortName: 'Hải Phòng',
    growth: 11.81,
    growthByYear: { 2024: 11.01, 2025: 11.81 },
    latitude: 20.8449,
    longitude: 106.6881,
    color: '#34d399',
  },
  {
    id: 'da-nang',
    name: 'Đà Nẵng',
    shortName: 'Đà Nẵng',
    growth: 9.18,
    growthByYear: { 2024: 7.51, 2025: 9.18 },
    latitude: 16.0544,
    longitude: 108.2022,
    color: '#2dd4bf',
  },
  {
    id: 'can-tho',
    name: 'Cần Thơ',
    shortName: 'Cần Thơ',
    growth: 7.23,
    growthByYear: { 2024: 7.12, 2025: 7.23 },
    latitude: 10.0452,
    longitude: 105.7469,
    color: '#fbbf24',
  },
  {
    id: 'hue',
    name: 'Huế',
    shortName: 'Huế',
    growth: 8.5,
    growthByYear: { 2024: 8.15, 2025: 8.5 },
    latitude: 16.4637,
    longitude: 107.5909,
    color: '#fb7185',
  },
];

export const cityGrdpSource =
  'https://www.nso.gov.vn/tin-tuc-thong-ke/2026/01/thong-cao-bao-chi-ve-ket-qua-tang-truong-tong-san-pham-tren-dia-ban-grdp-cua-34-tinh-thanh-pho-nam-2025/';

export const cityGrdpHistorySource =
  'https://www.nso.gov.vn/wp-content/uploads/2025/11/Sach-KT-XH-63-tinh-TP-2024.-PDF.pdf';

export type CityGrdpYear = 2024 | 2025;

export function getCityGrowth(cityId: string, year: CityGrdpYear) {
  return cityGrdp.find((city) => city.id === cityId)?.growthByYear[year] ?? 0;
}
