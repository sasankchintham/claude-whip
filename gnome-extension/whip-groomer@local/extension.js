import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Gio from 'gi://Gio';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {WHIP, drawWhip} from './draw.js';

const MAX_WHIPS = 3;
const DBUS_PATH ='/org/gnome/Shell/Extensions/WhipGroomer';
const DBUS_IFACE = `<node>
  <interface name="org.gnome.Shell.Extensions.WhipGroomer">
    <method name="Crack"/>
  </interface>
</node>`;

export default class WhipGroomerExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._running = new Map();

        Main.wm.addKeybinding('whip-shortcut', this._settings, Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL, () => this._playWhip());

        this._dbus = Gio.DBusExportedObject.wrapJSObject(DBUS_IFACE, {Crack: () => this._playWhip()});
        this._dbus.export(Gio.DBus.session, DBUS_PATH);
    }

    disable() {
        this._dbus.unexport();
        this._dbus = null;
        Main.wm.removeKeybinding('whip-shortcut');
        for (const [area, timeline] of this._running) {
            timeline.stop();
            area.destroy();
        }
        this._running = null;
        this._settings = null;
    }

    _playSound(name) {
        try {
            Gio.Subprocess.new(['pw-play', `${this.path}/sounds/${name}`], Gio.SubprocessFlags.NONE);
        } catch (e) {
            console.error(`whip-groomer: sound failed: ${e}`);
        }
    }

    _spawn(width, height, x, y, mirror, duration, draw) {
        const area = new St.DrawingArea({width, height, reactive: false});
        area.set_position(x, y);

        const timeline = new Clutter.Timeline({actor: area, duration});
        area.connect('repaint', a => {
            const cr = a.get_context();
            if (mirror) {
                cr.translate(width, 0);
                cr.scale(-1, 1);
            }
            draw(cr, timeline.get_elapsed_time());
            cr.$dispose();
        });
        timeline.connect('new-frame', () => area.queue_repaint());
        timeline.connect('completed', () => {
            this._running.delete(area);
            area.destroy();
        });

        Main.uiGroup.add_child(area);
        this._running.set(area, timeline);
        timeline.start();
    }

    _playWhip() {
        // Any local program can call Crack over D-Bus, so cap concurrent whips to prevent spamming.
        if (this._running.size >= MAX_WHIPS)
            return;
        const [x, y] = global.get_pointer();
        const monitor = global.display.get_monitor_geometry(global.display.get_current_monitor());
        // Swing from the right instead when there's no room for the handle on the left.
        const mirror = x - monitor.x < WHIP.tip[0] - WHIP.grip[0] + 80;
        const left = mirror ? x - (WHIP.width - WHIP.tip[0]) : x - WHIP.tip[0];

        this._playSound('whip.wav');
        this._spawn(WHIP.width, WHIP.height, left, y - WHIP.tip[1], mirror, WHIP.totalMs, drawWhip);
    }
}
