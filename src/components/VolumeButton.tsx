"use client";

import {useSite} from "@/utils/SiteContext";
import Speaker from "@/components/svg/Speaker";
import MutedSpeaker from "@/components/svg/MutedSpeaker";

export default function VolumeButton() {
    const site = useSite();
    const toggleVolume = () => {
        site.setVolume(site.volume > 0 ? 0 : 0.05);
    }

    return <div className={"w-full p-3 h-full secondary rounded-md flex items-center hover-scale"} onClick={toggleVolume}>
        {site.volume > 0 ? <Speaker /> : <MutedSpeaker/>}
    </div>
}