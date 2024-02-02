
export default function Rainbow() {
    return <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="rainbow"
                className="svg-inline--fa fa-rainbow" role="img"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
        <g transform="translate(320 256)">
            <g transform="translate(0, 0)  scale(0.8125, 0.8125)  rotate(0 0 0)">
                <path style={{fill: "url(#rainbow-grad)"}}
                      d="M320 96C178.6 96 64 210.6 64 352v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V352C0 175.3 143.3 32 320 32s320 143.3 320 320v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V352C576 210.6 461.4 96 320 96zm0 192c-35.3 0-64 28.7-64 64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V352c0-70.7 57.3-128 128-128s128 57.3 128 128v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V352c0-35.3-28.7-64-64-64zM160 352v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V352c0-123.7 100.3-224 224-224s224 100.3 224 224v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V352c0-88.4-71.6-160-160-160s-160 71.6-160 160z"
                      transform="translate(-320 -256)"></path>
            </g>
        </g>
        <linearGradient id={"rainbow-grad"} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f44336"/>
            <stop offset="10%" stopColor="#f44336"/>
            <stop offset="12.5%" stopColor="#ff9800"/>
            <stop offset="25%" stopColor="#9c27b0"/>
            <stop offset="37.5%" stopColor="#673ab7"/>
            <stop offset="50%" stopColor="#3f51b5"/>
            <stop offset="62.5%" stopColor="#03a9f4"/>
            <stop offset="75%" stopColor="#4caf50"/>
            <stop offset="100%" stopColor="#8bc34a"/>
        </linearGradient>
    </svg>
}