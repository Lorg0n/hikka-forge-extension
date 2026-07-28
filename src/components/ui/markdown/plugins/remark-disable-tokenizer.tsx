import type { Processor } from 'unified';

export default function remarkDisableTokenizer(this: Processor) {
    const data = this.data();

    const micromarkExtensions =
        data.micromarkExtensions || (data.micromarkExtensions = []);

    micromarkExtensions.push({
        disable: {
            null: ['codeIndented', 'codeFenced', 'codeText'],
        },
    });
}
