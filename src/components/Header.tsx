import Head from "next/head";

export default function Header({title, description}: {title: string, description: string}) {
    return <Head>
        <title key={"title"}>BarrelBets | {title}</title>
        <meta name="description" key={"desc"} content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:image" key={"image"} content="https://barrelbets.com/images/bg.png" />
    </Head>
}