﻿import { allIcons as icons, EmojiGroup, emojiStyle, textStyle } from "../emoji/emoji.js";
import { className, href, htmlFor, style, title } from "../html/attrs.js";
import { onClick } from "../html/evts.js";
import { A, Button, Div, H1, H2, Label, LI, P, Span, UL } from "../html/tags.js";
import "../protos.js";
import { FormDialog } from "./FormDialog.js";


const headerStyle = style({
    textDecoration: "none",
    color: "black",
    textTransform: "capitalize"
}),
    buttonStyle = style({
        fontSize: "200%",
        width: "2em"
    }),
    cancelEvt = new Event("emojiCanceled");

export class EmojiForm extends FormDialog {
    constructor() {
        super("emoji", "Emoji");

        this.header.append(
            H2("Recent"),
            this.recent = P("(None)"));

        const previousEmoji = [],
            allAlts = [];

        let selectedEmoji = null,
            idCounter = 0;

        const closeAll = () => {
            for (let alt of allAlts) {
                alt.hide();
            }
        }

        function combine(a, b) {
            let left = a.value;

            let idx = left.indexOf(emojiStyle.value);
            if (idx === -1) {
                idx = left.indexOf(textStyle.value);
            }
            if (idx >= 0) {
                left = left.substring(0, idx);
            }

            return {
                value: left + b.value,
                desc: a.desc + "/" + b.desc
            };
        }

        /**
         * 
         * @param {EmojiGroup} group
         * @param {HTMLElement} container
         * @param {boolean} isAlts
         */
        const addIconsToContainer = (group, container, isAlts) => {
            for (let icon of group.alts) {
                const btn = Button(
                        title(icon.desc),
                        buttonStyle,
                        onClick((evt) => {
                            selectedEmoji = selectedEmoji && evt.ctrlKey
                                ? combine(selectedEmoji, icon)
                                : icon;
                            this.preview.innerHTML = `${selectedEmoji.value} - ${selectedEmoji.desc}`;
                            this.confirmButton.unlock();

                            if (!!alts) {
                                alts.toggleOpen();
                                btn.innerHTML = icon.value + (alts.isOpen() ? "-" : "+");
                            }
                        }), icon.value);

                let alts = null;

                /** @type {HTMLUListElement|HTMLSpanElement} */
                let g = null;

                if (isAlts) {
                    btn.id = `emoji-with-alt-${idCounter++}`;
                    g = UL(
                        LI(btn,
                            Label(htmlFor(btn.id),
                                icon.desc)));
                }
                else {
                    g = Span(btn)
                }

                if (!!icon.alts) {
                    alts = Div();
                    allAlts.push(alts);
                    addIconsToContainer(icon, alts, true);
                    alts.hide();
                    g.appendChild(alts);
                    btn.style.width = "3em";
                    btn.innerHTML += "+";
                }

                if (!!icon.width) {
                    btn.style.width = icon.width;
                }

                if (!!icon.color) {
                    btn.style.color = icon.color;
                }

                container.appendChild(g);
            }
        };

        for (let group of Object.values(icons)) {
            if (group instanceof EmojiGroup) {
                const header = H1(),
                    container = P(),
                    headerButton = A(
                        href("javascript:undefined"),
                        title(group.desc),
                        headerStyle,
                        onClick(() => {
                            container.toggleOpen();
                            headerButton.innerHTML = group.value  + (container.isOpen() ? " -" : " +");
                        }),
                        group.value + " -");

                addIconsToContainer(group, container);
                header.appendChild(headerButton);
                this.content.appendChild(header);
                this.content.appendChild(container);
            }
        }

        this.footer.append(

            this.confirmButton = Button(className("confirm"),
                "OK",
                onClick(() => {
                    const idx = previousEmoji.indexOf(selectedEmoji);
                    if (idx === -1) {
                        previousEmoji.push(selectedEmoji);
                        this.recent.innerHTML = "";
                        addIconsToContainer(previousEmoji, this.recent);
                    }

                    this.hide();
                    this.dispatchEvent(new EmojiSelectedEvent(selectedEmoji));
                })),

            Button(className("cancel"),
                "Cancel",
                onClick(() => {
                    this.confirmButton.lock();
                    this.hide();
                    this.dispatchEvent(cancelEvt);
                })),

            this.preview = Span(style({ gridArea: "4/1/5/4" })));

        this.confirmButton.lock();

        this.selectAsync = () => {
            return new Promise((resolve, reject) => {
                let yes = null,
                    no = null;

                const done = () => {
                    this.removeEventListener("emojiSelected", yes);
                    this.removeEventListener("emojiCanceled", no);
                };

                yes = (evt) => {
                    done();
                    try {
                        resolve(evt.emoji);
                    }
                    catch (exp) {
                        reject(exp);
                    }
                };

                no = () => {
                    done();
                    resolve(null);
                };

                this.addEventListener("emojiSelected", yes);
                this.addEventListener("emojiCanceled", no);

                closeAll();
                this.show();
            });
        };
    }
}

class EmojiSelectedEvent extends Event {
    constructor(emoji) {
        super("emojiSelected");
        this.emoji = emoji;
    }
}