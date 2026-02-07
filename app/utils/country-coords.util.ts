import worldCountries from "world-countries";

type CountryCoords = {
	code: string;
	name: string;
	lat: number;
	lon: number;
};

type CountryRecord = {
	code: string;
	name: string;
	altName?: string;
	latlng: [number, number];
};

const countryList: CountryRecord[] = worldCountries
	.map((country) => {
		const lat = country.latlng?.[0];
		const lon = country.latlng?.[1];
		if (typeof lat !== "number" || typeof lon !== "number") return null;
		return {
			code: country.cca2,
			name: country.name.common,
			altName: country.name.official,
			latlng: [lat, lon],
		};
	})
	.filter(Boolean) as CountryRecord[];

const countryMap = new Map(
	countryList
		.map((country) => {
			const [lat, lon] = country.latlng;
			return [
				country.code,
				{ code: country.code, name: country.name, lat, lon },
			];
		})
		.filter(Boolean) as Array<[string, CountryCoords]>,
);

const nameMap = new Map(
	countryList
		.map((country) => {
			const [lat, lon] = country.latlng;
			return [
				country.name.toLowerCase(),
				{ code: country.code, name: country.name, lat, lon },
			];
		})
		.filter(Boolean) as Array<[string, CountryCoords]>,
);

const altNameMap = new Map(
	countryList
		.filter((country) => country.altName)
		.map((country) => {
			const [lat, lon] = country.latlng;
			return [
				country.altName!.toLowerCase(),
				{ code: country.code, name: country.name, lat, lon },
			];
		}) as Array<[string, CountryCoords]>,
);

export function getCountryCoordinates(
	value: {
		countryCode?: string | null;
		countryName?: string | null;
	} | null,
) {
	if (!value) return null;
	const code = value.countryCode?.toUpperCase();
	if (code && countryMap.has(code)) {
		return countryMap.get(code) ?? null;
	}
	const name = value.countryName?.toLowerCase();
	if (name && nameMap.has(name)) {
		return nameMap.get(name) ?? null;
	}
	if (name && altNameMap.has(name)) {
		return altNameMap.get(name) ?? null;
	}
	return null;
}
