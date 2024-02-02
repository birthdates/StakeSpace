import {Team} from "@/utils/games";
import {AccountData} from "@/utils/account";

export const formatId = (id: string) => {
    // Replace all _ with space and capitalize first letter of each word
    return id.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

export const MINE_GRID_SIZE = 5;
export const MIN_MINES_BET = 0.1;

export const roundToSecondDecimal = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

export const getMinesMultiplier = (mines: number, revealed: number) => {
    const multiplier = Math.pow(2, mines - revealed);
    return multiplier;
}

export function getTeams(mode: string, host?: AccountData) {
    let teams: Team[] = [];
    switch (mode) {
        case "1v1":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: 1
                },
                {
                    id: 1,
                    players: [],
                    maxPlayers: 1
                }
            ];
            break;
        case "1v1v1":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: 1
                },
                {
                    id: 1,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 2,
                    players: [],
                    maxPlayers: 1
                }
            ];
            break;
        case "1v1v1v1":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: 1
                },
                {
                    id: 1,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 2,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 3,
                    players: [],
                    maxPlayers: 1
                }
            ];
            break;
        case "1v1v1v1v1":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: 1
                },
                {
                    id: 1,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 2,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 3,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 4,
                    players: [],
                    maxPlayers: 1
                }
            ];
            break;
        case "1v1v1v1v1v1":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: 1
                },
                {
                    id: 1,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 2,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 3,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 4,
                    players: [],
                    maxPlayers: 1
                },
                {
                    id: 5,
                    players: [],
                    maxPlayers: 1
                }
            ];
            break;
        case "2v2":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: 2
                },
                {
                    id: 1,
                    players: [],
                    maxPlayers: 2
                }
            ];
            break;
        case "3v3":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: 3
                },
                {
                    id: 1,
                    players: [],
                    maxPlayers: 3
                }
            ];
            break;
        case "5p":
        case "6p":
        case "3p":
        case "4p":
        case "2p":
            teams = [
                {
                    id: 0,
                    players: host ? [host] : [],
                    maxPlayers: parseInt(mode.split("p")[0])
                }
            ];
            break;
    }
    return teams;
}

export const getTeamColor = (id: number) => {
    // Return r, g, b values
    switch (id) {
        case 0:
            return "205, 65, 43"
        case 1:
            return "170, 222, 78";
        case 2:
            return "63, 153, 215";
        case 3:
            return "241, 196, 15";
        case 4:
            return "252, 115, 3";
        case 5:
            return "52, 4, 209";
    }
}


export type Winnings = {wonBalances: number[], winningTeams: number[], winPerTeam: number};