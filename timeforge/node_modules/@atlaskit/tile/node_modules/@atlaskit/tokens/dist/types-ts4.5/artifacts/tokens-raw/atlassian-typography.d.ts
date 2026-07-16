/**
 * THIS FILE WAS CREATED VIA CODEGEN DO NOT MODIFY {@see http://go/af-codegen}
 * @codegen <<SignedSource::74e601b3ce776abbd8b70ea18be310cc>>
 * @codegenCommand yarn build tokens
 */
type TokenValue = string;
type TokenValueOriginal = string | {
    fontWeight: string;
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    fontStyle: string;
    letterSpacing: string;
};
type TokenAttributes = {
    group: string;
    state: string;
    introduced: string;
    description: string;
    suggest?: string[];
    deprecated?: string;
    replacement?: string;
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
    cleanName: string;
};
declare const tokens: Token[];
export default tokens;
