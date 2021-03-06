/*
 * Copyright (c) 2018 João Morais under the MIT license.
 * https://github.com/jcsmorais/shortcut-buttons-flatpickr/
 */

import { Instance as Flatpickr } from 'flatpickr/dist/types/instance.d';

export namespace ShortcutButtonsFlatpickr {
    export type OnClickSignature = (index: number, fp: Flatpickr) => void;

    export type Attributes = { [name: string]: string };

    export type Button = {
        attributes?: Attributes,
        label: string,
    };

    export type Config = {
        button: Button | Button[],
        label?: string,
        onClick?: OnClickSignature | OnClickSignature[],
        theme?: string,
        expand?: boolean,
    };
}

const defaultConfig: Partial<ShortcutButtonsFlatpickr.Config> = {
    theme: 'light',
};

/**
 * List of attributes that can be set through button's options.
 */
const supportedAttributes = new Set([
    'accesskey',
    'aria-label',
]);

/**
 * Adds shortcut buttons to flatpickr providing users an alternative way to interact with the datetime picker.
 *
 * Example usage:
 *
 * ```ts
 * flatpickr('.target-input-element', {
 *     // ...
 *     plugins: [ShortcutButtonsPlugin({
 *         button: {
 *             label: 'The Beginning Of Time',
 *         },
 *         onClick: (index: number, fp: Flatpickr) => {
 *             // Do something when a button is clicked
 *         },
 *         theme: 'light',
 *     })],
 * })
 * ```
 *
 * @param config Configuration options.
 *
 * Supported options are:
 *    `button`: button(s).
 *    `button.attributes`: button's attributes.
 *    `button.label`: button's label.
 *    `label`: label including a sentence stating that the user can use the calendar controls or one of the buttons.
 *    `onClick`: callback(s) invoked when plugin's buttons are clicked.
 *    `theme`: flatpickr's theme.
 */
export function ShortcutButtonsPlugin(config: ShortcutButtonsFlatpickr.Config) {
    const cfg = { ...defaultConfig, ...config };

    return (fp: Flatpickr) => {
        /**
         * Element that wraps this plugin's dependent elements.
         */
        let wrapper: HTMLElement;

        /**
         * Handles click events on plugin's button.
         */
        function onClick(event: Event) {
            event.stopPropagation();
            event.preventDefault();

            const target = event.target as HTMLButtonElement;
            if (target.tagName.toLowerCase() !== 'button' || typeof cfg.onClick === 'undefined') {
                return;
            }

            const index = parseInt(target.dataset.index, 10);

            const callbacks: ShortcutButtonsFlatpickr.OnClickSignature[] = Array.isArray(cfg.onClick) ?
                cfg.onClick :
                [cfg.onClick];

            for (const callback of callbacks) {
                if (typeof callback === 'function') {
                    callback(index, fp);
                }
            }
        }

        /**
         * Handles key down events on plugin's button.
         */
        function onKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLButtonElement;
            if (event.key !== 'Tab' || target.tagName.toLowerCase() !== 'button') {
                return;
            }

            if ((event.shiftKey && !target.previousSibling) || (!event.shiftKey && !target.nextSibling)) {
                event.preventDefault();
                fp.element.focus();
            }
        }

        /**
         * Set given button's attributes.
         */
        function setButtonsAttributes(button: HTMLButtonElement, attributes?: ShortcutButtonsFlatpickr.Attributes) {
            Object.keys(attributes).filter((attribute) => supportedAttributes.has(attribute)).forEach(
                (key) => button.setAttribute(key, attributes[key])
            );
        }

        function calendarExpansion() {
          if (typeof cfg.expand === 'boolean') {
            return cfg.expand;
          } else {
            return false;
          }
        }

        return {
            /**
             * Initialize plugin.
             */
            onReady: () => {
                wrapper = document.createElement('div');
                wrapper.classList.add('shortcut-buttons-flatpickr-wrapper', cfg.theme);

                if (typeof cfg.label !== 'undefined' && cfg.label.length) {
                    const label = document.createElement('div');
                    label.classList.add('shortcut-buttons-flatpickr-label');
                    label.textContent = cfg.label;

                    wrapper.appendChild(label);
                }

                const buttons = document.createElement('div');
                buttons.classList.add('shortcut-buttons-flatpickr-buttons');

                (Array.isArray(cfg.button) ? cfg.button : [cfg.button]).forEach((b, index) => {
                    const button = document.createElement('button');
                    button.classList.add('shortcut-buttons-flatpickr-button');
                    button.textContent = b.label;
                    button.dataset.index = String(index);
                    if (typeof b.attributes !== 'undefined') {
                        setButtonsAttributes(button, b.attributes);
                    }

                    buttons.appendChild(button);

                    fp.pluginElements.push(button);
                });

                wrapper.appendChild(buttons);

                if (calendarExpansion() === true && typeof fp.calendarContainer !== 'undefined') {
                  const generatedCalendar = fp.calendarContainer;

                  generatedCalendar.setAttribute('style', 'width:500px;');

                  const flatpickrMonths = generatedCalendar.getElementsByClassName('flatpickr-months')[0];

                  flatpickrMonths.getElementsByClassName(
                    'flatpickr-current-month')[0].setAttribute('style', 'width:179px;');

                  flatpickrMonths.getElementsByClassName(
                    'flatpickr-next-month')[0].setAttribute('style', 'margin-right:200px;');

                  const lcontainer = document.createElement('div');
                  lcontainer.classList.add('flatpickr-lContainer');
                  lcontainer.appendChild(wrapper);

                  const innerContainer = generatedCalendar.getElementsByClassName('flatpickr-innerContainer')[0];
                  innerContainer.appendChild(lcontainer);

                  wrapper.setAttribute('style', 'background-color:#FFFFFF');

                } else if (typeof fp.calendarContainer !== 'undefined') {
                  fp.calendarContainer.appendChild(wrapper);
                }
                wrapper.addEventListener('click', onClick);
                wrapper.addEventListener('keydown', onKeyDown);
            },

            /**
             * Clean up before flatpickr is destroyed.
             */
            onDestroy: () => {
                wrapper.removeEventListener('keydown', onKeyDown);
                wrapper.removeEventListener('click', onClick);
                wrapper = undefined;
            },
        };
    };
}
