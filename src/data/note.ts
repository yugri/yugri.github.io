import { type CollectionEntry, getCollection } from "astro:content";
import type { Lang } from "@/i18n/utils";
import { defaultLang } from "@/i18n/ui";

export async function getAllNotes(): Promise<CollectionEntry<"note">[]> {
	return await getCollection("note");
}

export function filterNotesByLang(notes: CollectionEntry<"note">[], lang: Lang) {
	return notes.filter((note) => (note.data.lang ?? defaultLang) === lang);
}

export async function getNotesByLang(lang: Lang) {
	const notes = await getAllNotes();
	return filterNotesByLang(notes, lang);
}
