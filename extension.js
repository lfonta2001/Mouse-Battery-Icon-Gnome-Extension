import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const UPDATE_INTERVAL = 60; // segundos

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(ext) {
            super._init(0.0, 'Mouse Battery');

            this._ext = ext;

            const layout = Clutter.BinLayout.new();

            // this._box = new St.BoxLayout({
            //     style_class: 'mouse-battery-box',
            //     y_align: Clutter.ActorAlign.CENTER,
            //     spacing: 4,
            // });

            this._icon = new St.Icon({
                gicon: Gio.icon_new_for_string(`${ext.path}/icons/icon.svg`),
                y_align: Clutter.ActorAlign.CENTER,
                icon_size: 16,
                style_class: 'system-status-icon',
            });

            this._label = new St.Label({
                text: '--%',
                y_align: Clutter.ActorAlign.CENTER,
            });

            this._container = new St.Widget({
                layout_manager: layout,
            });

            this._icon.translation_y = -10;
            this._icon.opacity = 0;

            this._label.translation_y = 0;
            this._label.opacity = 255;

            this._container.add_child(this._label);
            this._container.add_child(this._icon);

            this.add_child(this._container);

            this.connect('enter-event', () => {
                this._label.ease({
                    translation_y: -10,
                    opacity: 0,
                    duration: 150,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });

                this._icon.ease({
                    translation_y: 0,
                    opacity: 255,
                    duration: 150,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            });

            this.connect('leave-event', () => {
                this._icon.ease({
                    translation_y: -10,
                    opacity: 0,
                    duration: 150,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });

                this._label.ease({
                    translation_y: 0,
                    opacity: 255,
                    duration: 150,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            });

            this.connect('button-press-event', () => this._update());

            // this._box.add_child(this._icon);
            // this._box.add_child(this._label);
            // this.add_child(this._box);

            this._timeout = null;
            this._update();
	    // this._startTimer(); Me tranca la pc cada vez que llama al update, asique actualizar solo cuando se hace click, asi no me rompe las bolas
        }
        
        _readCmd(cmd) {
            let [ok, out] = GLib.spawn_command_line_sync(cmd);
            if (!ok || !out) return null;
            return new TextDecoder().decode(out).trim();
        }
        
        _getStatus() {
            let text = this._readCmd('cat /sys/class/power_supply/hiddp_battery_*/status');
            if (!text)
                return null;
                
            return text.split('\n')[0].trim();
        }

        _getBattery() {
            try {
                let text = this._readCmd('cat /sys/class/power_supply/hidpp_battery_*/capacity');
                
                if (text) {
                    let value = parseInt(text.split('\n')[0], 10);
                    if (!isNaN(value))
                        return value;
                }
                
                text = this._readCmd('solaar show');
                if (!text) return null;
                
                let m = text.match(/Battery:\s*(\d+)%/i);
                return m ? parseInt(m[1], 10) : null;
            } catch (e) {
                logError(e);
                return null;
            }
        }

        _update() {
            let level = this._getBattery();
            let status = this._getStatus();
            
            this._label.remove_style_class_name('battery-low');
            this._label.remove_style_class_name('battery-charging');

            if (level == null) {
                this._label.text = '--%';
                return GLib.SOURCE_CONTINUE;
            }
            
            this._label.text = `${level}%`;

            if (status === "Charging") {
                this._label.add_style_class_name('battery-charging');
            } else if (level <= 25) {
                this._label.add_style_class_name('battery-low');
            }
            
            return GLib.SOURCE_CONTINUE;
        }

        _startTimer() {
            if (this._timeout) GLib.source_remove(this._timeout);
            this._timeout = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                UPDATE_INTERVAL,
                () => this._update(),
            );
        }

        destroy() {
            if (this._timeout) {
                GLib.source_remove(this._timeout);
                this._timeout = null;
            }
            super.destroy();
        }
    },
);

export default class MouseBatteryExtension extends Extension {
    enable() {
        this._theme = St.ThemeContext.get_for_stage(global.stage).get_theme();

        this._stylesheet = Gio.File.new_for_path(`${this.path}/stylesheet.css`);

        this._theme.load_stylesheet(this._stylesheet);

        this._indicator = new Indicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        if (this._stylesheet) {
            this._theme.unload_stylesheet(this._stylesheet);
            this._stylesheet = null;
        }
    }
}
