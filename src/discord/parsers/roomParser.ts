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
        /*roomLocationOverride('igloo', localizer.__('LOC_IGLOO')),

        roomLocationOverride('dojo fire', localizer.__('LOC_DOJO_FIRE')),
        roomLocationOverride('dojo water', localizer.__('LOC_DOJO_WATER')),
        roomLocationOverride('dojo snow', localizer.__('LOC_DOJO_SNOW')),

        gameLocationOverride('snow', localizer.__('LOC_GAME_SNOW')),
        gameLocationOverride('smoothie', localizer.__('LOC_GAME_SMOOTHIE')),
        gameLocationOverride('sled race', undefined, '', 'sled'),
        
        gameLocationOverride('igloo_card', localizer.__('LOC_GAME_CARD')),
        gameLocationOverride('system defender', undefined, undefined, 'tower'),
        gameLocationOverride('bits and bolts', undefined, undefined, 'robots'),
        gameLocationOverride('wave', undefined, undefined, 'waves'),
        gameLocationOverride('biscuit', undefined, undefined, 'hydro'),
        gameLocationOverride('puffle', undefined, undefined, 'roundup'),
        gameLocationOverride('puffle rescue', undefined, undefined, 'rescue'),
        gameLocationOverride('subgame', undefined, undefined, 'sub'),
        gameLocationOverride('card jitsu', undefined, undefined, 'card'),
        gameLocationOverride('fire sensei', undefined, undefined, 'senseifire'),
        
        gameLocationOverride('find four', undefined, undefined, 'four', true),
        gameLocationOverride('treasure hunt', undefined, undefined, 'treasurehunt', true),

        gameLocationOverride('mission', undefined, undefined, 'q', true, true)*/
        // Zero updates this file
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
                room_match = room_name.toLowerCase().replace(' ', '');
            }
        }

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