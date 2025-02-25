const presence = new Presence({ clientId: "1125405319594512404" }),
	browsingTimestamp = Math.floor(Date.now() / 1000);

const enum Assets {
	Logo = "https://i.imgur.com/7pAQJgm.png",
}

presence.on("UpdateData", async () => {
	const { pathname, hostname, href } = document.location,
		pathArr = pathname.split("/"),
		{ details, smallImageKey, largeImageKey, state, buttons } = getPageData(
			pathArr[1],
			pathArr[2],
			pathArr[3],
			hostname,
			href
		),
		presenceData: PresenceData = {
			largeImageKey: largeImageKey || Assets.Logo,
			startTimestamp: browsingTimestamp,
			details,
		};
	if (buttons) presenceData.buttons = buttons;
	if (smallImageKey) presenceData.smallImageKey = smallImageKey;
	if (state) presenceData.state = state;

	if (!(await presence.getSetting<boolean>("details"))) {
		presenceData.details = "Browsing Kick...";
		delete presenceData.state;
		presenceData.largeImageKey = Assets.Logo;
		delete presenceData.smallImageKey;
		delete presenceData.buttons;
	}

	if (await presence.getSetting<boolean>("logo"))
		presenceData.largeImageKey = Assets.Logo;

	if (details) presence.setActivity(presenceData);
});

function getPageData(
	page: string,
	pageDetail: string,
	title: string,
	hostname: string,
	url: string
): {
	details?: string;
	smallImageKey?: string;
	largeImageKey?: string;
	state?: string;
	buttons?: [ButtonData, ButtonData?];
} {
	switch (hostname) {
		case "kick.com": {
			switch (page) {
				case "":
					return { details: "Viewing home...", smallImageKey: Assets.Search };
				case "categories": {
					const activeMainCategory = document.querySelector(
						"a.category-tile-active"
					)?.textContent;
					let state = "",
						largeImageKey = "";

					if (activeMainCategory) {
						state = activeMainCategory;
						// Replace .gif with .png on main category image
						const imageElement = document.querySelector(
								'a.category-tile-active [src$=".gif"]'
							),
							newSrc = imageElement.getAttribute("src").replace(".gif", ".png");
						imageElement.setAttribute("src", newSrc);
						largeImageKey = newSrc;
					}
					// If there is a subcategory
					if (pageDetail && title) {
						state += ` > ${formatText(pageDetail)} > ${formatText(title)}`;
						largeImageKey =
							document.querySelector<HTMLImageElement>("div.h-full > img")?.src;
					}
					return {
						details: "Viewing categories...",
						state,
						largeImageKey,
						smallImageKey: Assets.Search,
					};
				}
				case "following": {
					return {
						details: "Viewing following...",
						state: `${
							document.querySelector(".\\!border-primary\\/100").textContent
						} section`,
						smallImageKey: Assets.Search,
					};
				}
				case "dashboard": {
					let state = document.querySelector(
						".router-link-active .item-title"
					).textContent;
					const isContentExpanded = document.querySelector(
						".content-expanded .item-title"
					);

					if (isContentExpanded) {
						state = `${isContentExpanded.textContent} >
							${
								document.querySelector(
									".content-expanded .router-link-active .item-title"
								).textContent
							}`;
					}
					return {
						details: `Viewing ${formatText(page)}...`,
						state,
						smallImageKey: Assets.Viewing,
					};
				}
				case "transactions": {
					return {
						details: `Viewing ${formatText(page)}...`,
						state: formatText(pageDetail),
					};
				}
				case "community-guidelines":
				case "dmca-policy":
				case "privacy-policy":
				case "terms-of-service":
					return {
						details: `Reading ${formatText(page)}...`,
						smallImageKey: Assets.Reading,
					};
				default:
					// watching/viewing a stream
					if (document.querySelector(".stream-username")) {
						let smallImageKey = "",
							state = "",
							buttons: [ButtonData, ButtonData?];
						const streamer =
							document.querySelector(".stream-username").textContent;
						if (document.querySelector(".odometer-value")) {
							state = `Watching: ${streamer}`;
							smallImageKey = Assets.Live;
							buttons = [
								{
									label: "Watch Stream",
									url,
								},
							];
						} else {
							state = `Viewing: ${streamer}`;
							smallImageKey = Assets.Viewing;
							buttons = [
								{
									label: "View Streamer",
									url,
								},
							];
						}
						return {
							details: document.querySelector(".stream-title").textContent,
							state,
							largeImageKey:
								document.querySelector<HTMLImageElement>(".owner-avatar img")
									?.src,
							smallImageKey,
							buttons,
						};
					} else {
						return {
							details: "Browsing Kick...",
						};
					}
			}
		}
		case "help.kick.com": {
			switch (pageDetail) {
				case "collections": {
					return {
						details: document.querySelector("header.text-2xl").textContent,
						state: "Searching resource category...",
						smallImageKey: Assets.Search,
					};
				}
				case "articles": {
					return {
						details: document.querySelector("header.text-2xl").textContent,
						state: "Reading article...",
						smallImageKey: Assets.Reading,
					};
				}
				default: {
					return { details: "Browsing Kick Help..." };
				}
			}
		}
	}
}

function formatText(text: string) {
	return text
		.replace(/-/g, " ")
		.replace(/\b\w/g, (match: string) => match.toUpperCase())
		.replace(/%C2%A0$/, "");
}
