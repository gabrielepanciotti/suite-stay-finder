import type { Stay, StayKind } from "./api";

export const kindLabels: Record<StayKind, string> = {
  hotel: "Hotel", apartment: "Appartamento", hostel: "Ostello", bnb: "Bed & breakfast", camping: "Campeggio", other: "Altro",
};
export const kindOptions = Object.entries(kindLabels) as [StayKind, string][];
export const formatPrice = (stay: Stay) => stay.price_per_night == null ? "—" : new Intl.NumberFormat("it-IT", { style: "currency", currency: stay.currency || "EUR" }).format(Number(stay.price_per_night));
export const matchesText = (stay: Stay, query: string) => `${stay.name} ${stay.location} ${kindLabels[stay.kind]}`.toLocaleLowerCase("it").includes(query.trim().toLocaleLowerCase("it"));
