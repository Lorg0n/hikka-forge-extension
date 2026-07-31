import type { Processor } from 'unified';

type MicromarkExtension = {
    disable: {
        null: string[];
    };
};

type RemarkData = {
    micromarkExtensions?: MicromarkExtension[];
};

export default function remarkDisableTokenizer(this: Processor) {
    const data = this.data() as unknown as RemarkData;

    const micromarkExtensions =
        data.micromarkExtensions || (data.micromarkExtensions = []);

    micromarkExtensions.push({
        disable: {
            null: ['codeIndented', 'codeFenced', 'codeText'],
        },
    });
}
