import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {
    faBolt, faChampagneGlasses,
    faCrown,
    faFishFins,
    faGhost, faHeart,
    faMedal, faPeace, faRadiation,
    faRocket,
    faStar,
    faSun
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Tooltip} from "react-tooltip";

type LevelIcon = {
    minLevel: number;
    icon: IconProp;
    color: string;
}

export const LEVEL_ICONS: LevelIcon[] = [
    {icon: faChampagneGlasses, minLevel: 1, color: "#d1d1d1"},
    {icon: faGhost, minLevel: 10, color: "#595959"},
    {icon: faFishFins, minLevel: 20, color: "#79a7d9"},
    {icon: faRocket, minLevel: 30, color: "#3541b5"},
    {icon: faMedal, minLevel: 40, color: "#f7e259"},
    {icon: faSun, minLevel: 50, color: "#db8c3d"},
    {icon: faStar, minLevel: 60, color: "#db573d"},
    {icon: faBolt, minLevel: 70, color: "#f0d89c"},
    {icon: faHeart, minLevel: 80, color: "#a975e0"},
    {icon: faPeace, minLevel: 90, color: "#196115"},
    {icon: faCrown, minLevel: 100, color: "#b82129"},
    {icon: faRadiation, minLevel: 500, color : "#9fb821"},
];

export default function Level({level, className}: {level: number, className?: string}) {
    let icon: LevelIcon = LEVEL_ICONS[0];
    const randomID = Math.random().toString(36).substring(7);

    for (let i = LEVEL_ICONS.length - 1; i >= 0; i--) {
        if (level >= LEVEL_ICONS[i].minLevel) {
            icon = LEVEL_ICONS[i];
            break;
        }
    }

    return <span className={"cursor-pointer " + className} style={{
        "--color": icon.color
    } as any}>
        <FontAwesomeIcon className={"shadow-icon z-30"} icon={icon.icon} style={{color: icon.color}} data-tooltip-id={randomID}
                         data-tooltip-content={`Level ${level}`}
                         data-tooltip-place="top" />
        <span className={"text-sm"}><Tooltip id={randomID} /></span>
    </span>
}