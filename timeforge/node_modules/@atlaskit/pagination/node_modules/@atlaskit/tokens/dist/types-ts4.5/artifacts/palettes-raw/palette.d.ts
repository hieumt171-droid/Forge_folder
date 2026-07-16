/**
 * THIS FILE WAS CREATED VIA CODEGEN DO NOT MODIFY {@see http://go/af-codegen}
 * @codegen <<SignedSource::53794f446833e9543b9fc09809fc6844>>
 * @codegenCommand yarn build tokens
 */
type TokenValue = string | number;
type TokenValueOriginal = string | number;
type TokenAttributes = {
    group: string;
    category: string;
};
type Token = {
    value: TokenValue;
    filePath: string;
    isSource: boolean;
    attributes: TokenAttributes;
    original: {
        value: TokenValueOriginal;
        attributes: TokenAttributes;
    };
    name: string;
    path: string[];
};
declare const tokens: Token[];
export default tokens;
