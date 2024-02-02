import Link from "next/link";

export default function Back({src, title}: {src: string, title: string}) {
    return <Link href={src} className="flex flex-row items-center">
        <svg data-v-d64022ba="" aria-hidden="true" focusable="false" data-prefix="fad" data-icon="long-arrow-left"
             role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"
             className="mr-2 svg-inline--fa fa-long-arrow-left fa-w-14">
            <g data-v-d64022ba="" className="fa-group">
                <path data-v-d64022ba="" fill="currentColor"
                      d="M128.09 220H424a24 24 0 0 1 24 24v24a24 24 0 0 1-24 24H128.09l-35.66-36z"
                      className="fa-secondary"></path>
                <path data-v-d64022ba="" fill="currentColor"
                      d="M142.56 409L7 273.5v-.06a25.23 25.23 0 0 1 0-34.84l.06-.06 135.5-135.49a24 24 0 0 1 33.94 0l17 17a24 24 0 0 1 0 33.94L92.43 256 193.5 358a24 24 0 0 1 0 33.94l-17 17a24 24 0 0 1-33.94.06z"
                      className="fa-primary"></path>
            </g>
        </svg>
        <span className="uppercase">Back to {title}</span>
    </Link>
}