export type TestGroups = Record<'home' | 'tooling' | 'publication', string[]>;
export declare const GROUPS: readonly string[];
export declare function validateGroups(groups: TestGroups, discovered: string[]): TestGroups;
export declare function readGroups(repo: string): TestGroups;
