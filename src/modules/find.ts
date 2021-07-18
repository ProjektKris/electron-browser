export const FindEmpty = (arr: any[]): number => {
    /*
    Returns an index that is empty in `arr` array.
    If there are no empty indexes, it will return arr.length
    */
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == null) {
            return i;
        }
    }
    return arr.length;
};

export const FindNext = (arr: any[], currentIndex: number): number => {
    for (let i = currentIndex + 1; i < arr.length; i++) {
        if (arr[i] != null) {
            return i;
        }
    }
};

export const FindPrev = (arr: any[], currentIndex: number): number => {
    for (let i = currentIndex - 1; i >= 0; i--) {
        if (arr[i] != null) {
            return i;
        }
    }
};

export const FindLength = (arr: any[]): number => {
    let length: number = 0;
    for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        if (element != null) {
            length += 1;
        }
    }
    return length;
};
