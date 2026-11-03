import { BrowserWindow } from "electron";
import { setLocationsInStore } from "../../discord";
import { Store } from "../../store";
import { CPLocation, CPLocationType } from "../../store/DiscordState";
import { getRoomsJsonFromParams, RoomsResponse } from "../requestHandler";

type CPLocationOverride = {
    room_name: string,
    room_display_name: string,
    room_key?: string,
    room_type: CPLocationType,
    room_match?: string,
    name_included: boolean,
    match_override: boolean
}

function roomLocationOverride(room_name: string, room_display_name?: string, room_key?: string, room_match?: string, name_included?: boolean, match_override?: boolean): CPLocationOverride {
    if (name_included == undefined) {
        name_included = false;
    }

    if (match_override == undefined) {
        match_override = false;
    }

    return {room_name, room_display_name, room_key, room_type: CPLocationType.Room, room_match, name_included, match_override};
}

function gameLocationOverride(room_name: string, room_display_name?: string, room_key?: string, room_match?: string, name_included?: boolean, match_override?: boolean): CPLocationOverride {
    if (name_included == undefined) {
        name_included = false;
    }

    if (match_override == undefined) {
        match_override = false;
    }

    return {room_name, room_display_name, room_key, room_type: CPLocationType.Game, room_match, name_included, match_override};
}

export const updateRooms = (store: Store, result: RoomsResponse) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rooms = Object.values(result.roomsJson) as any[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localizedRooms = result.localizedJson ? Object.values(result.localizedJson) as any[] : [];

    const cpLocations: CPLocation[] = [];

    const localizer = store.private.get('localizer');

    // Some overrides to fix some room data due to Disney weirdness.
    const locationOverrides: CPLocationOverride[] = [
        roomLocationOverride('igloo', localizer.__('LOC_IGLOO')),
        
        gameLocationOverride('aqua grabber', undefined, undefined, 'sub'),
        gameLocationOverride('astro barrier', undefined, undefined, 'astro'),
        gameLocationOverride('bean counters', undefined, undefined, 'beans'),
        gameLocationOverride('puffle roundup', undefined, undefined, 'roundup'),
        gameLocationOverride('hydro hopper', undefined, undefined, 'hydro'),
        gameLocationOverride('ice fishing', undefined, undefined, 'fish'),
        gameLocationOverride('cart surfer', undefined, undefined, 'cartsurfer'),
        gameLocationOverride('jet pack adventure', undefined, undefined, 'jetpack'),
        gameLocationOverride("catchin' waves", undefined, undefined, 'waves'),
        gameLocationOverride('dj3k', undefined, undefined, 'mixmaster'),
        gameLocationOverride('puffle launch', undefined, undefined, 'cannon'),
        gameLocationOverride('puffle rescue', undefined, undefined, 'rescue'),
        gameLocationOverride('system defender', undefined, undefined, 'tower'),
        gameLocationOverride('bits and bolts', undefined, undefined, 'robots'),
        gameLocationOverride('dance contest', undefined, undefined, 'dancing'),
        gameLocationOverride('smoothie smash', undefined, undefined, 'smoothie'),
        gameLocationOverride('sled race', undefined, undefined, 'sled'),

        gameLocationOverride('sensei', undefined, undefined, 'sensei'),
        gameLocationOverride('fire sensei', undefined, undefined, 'senseifire'),
        gameLocationOverride('water sensei', undefined, undefined, 'watersensei'),

        gameLocationOverride('card-jitsu', undefined, undefined, 'card'),
        gameLocationOverride('card-jitsu fire', undefined, undefined, 'fire'),
        gameLocationOverride('card-jitsu water', undefined, undefined, 'water'),
        gameLocationOverride('card-jitsu snow', undefined, undefined, 'snow'),

        gameLocationOverride('paint by letters: my puffle', undefined, undefined, 'book1'),
        gameLocationOverride('paint by letters: burnt out bulbs', undefined, undefined, 'book2'),
        gameLocationOverride('paint by letters: lime green dojo clean', undefined, undefined, 'book3'),

        gameLocationOverride('balloon pop', undefined, undefined, 'balloon'),
        gameLocationOverride('ring the bell', undefined, undefined, 'bell'),
        gameLocationOverride('feed-a-puffle', undefined, undefined, 'feed'),
        gameLocationOverride('memory card game', undefined, undefined, 'memory'),
        gameLocationOverride('puffle paddle', undefined, undefined, 'paddle'),
        gameLocationOverride('puffle shuffle', undefined, undefined, 'shuffle'),
        gameLocationOverride('spin to win', undefined, undefined, 'spin'),
        gameLocationOverride('puffle soaker', undefined, undefined, 'soaker'),

        gameLocationOverride('mission', undefined, undefined, 'q', true, true),
    ];

    /*
    This pulls the room names out of the corresponding rooms.jsonp
    for the selected language.
    */

    for (const room of rooms) {
        const room_id = Number(room.room_id);
        let room_key = room.room_key ? String(room.room_key) : undefined;
        let room_type;

        let room_name = String(room.name);
        let display_name = String(room.display_name);

        let room_match: string;

        const locOverride: CPLocationOverride = locationOverrides.filter(override => {
            // Room name matches override or display name includes room name override
            return (override.room_name == room_name.toLowerCase()) || (override.name_included && display_name.toLowerCase().includes(override.room_name));
        })[0];

        if (locOverride != undefined) {
            // Found an override so we can override.
            room_key = locOverride.room_key;
            room_type = locOverride.room_type;
            
            if (!locOverride.match_override) {
                // room name is used as the argument for overriding the match name.
                room_name = locOverride.room_name;
            }

            if (locOverride.room_display_name != undefined) {
                display_name = locOverride.room_display_name;
            }
            
            // Match should be room name override replaced w/ room match override
            if (locOverride.match_override) {
                room_match = room_name.toLowerCase().replace(locOverride.room_name, locOverride.room_match);
            } else {
                room_match = locOverride.room_match;
            }
        } else {
            // No override for this one.
            room_type = room_key ? CPLocationType.Room : CPLocationType.Game;
        }

        if (room_match == undefined) {
            // We didn't get a room_match from the override so we need to set it.
            if (room_key != undefined) {
                room_match = room_key;
            } else {
                room_match = room_name.toLowerCase().replace(/\s+/g, '');
            }
        }

        room_match = room_match.replace(/\s+/g, '');

        // Sets the localized name if one exists.
        // We can skip this if the display name was overridden.
        if (localizedRooms && locOverride == undefined) {
            const localizedName = localizedRooms.filter(localizedRoom => {
                return room.display_name === localizedRoom.display_name;
            })[0]?.name;
            
            if (localizedName != undefined) {
                display_name = localizedName;
            }
        }

        const cpLocation: CPLocation = {
            room_id: room_id,
            name: display_name,
            room_key: room_key,
            room_type: room_type,
            match: room_match,
        };

        cpLocations.push(cpLocation);
    }

    setLocationsInStore(store, cpLocations);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseAndUpdateRooms = async (store: Store, mainWindow: BrowserWindow, params: any) => {
    const result = await getRoomsJsonFromParams(store, mainWindow, params);

    updateRooms(store, result);
};