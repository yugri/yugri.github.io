import rss from "@astrojs/rss";
import { siteConfig } from "@/site.config";
import { getNotesByLang } from "@/data/note";

export const GET = async () => {
	const notes = await getNotesByLang("uk");

	return rss({
		title: `${siteConfig.title} — Нотатки (українською)`,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: notes.map((note) => ({
			title: note.data.title,
			pubDate: note.data.publishDate,
			link: `notes/${note.id}/`,
		})),
	});
};
