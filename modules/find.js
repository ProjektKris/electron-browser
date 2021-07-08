
module.exports.FindEmpty = (arr) => {
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

module.exports.FindNext = (arr, currentIndex) => {
    for (let i = currentIndex + 1; i < arr.length; i++) {
        if (arr[i] != null) {
            return i;
        }
    }
};

module.exports.FindPrev = (arr, currentIndex) => {
    for (let i = currentIndex - 1; i >= 0; i++) {
        if (arr[i] != null) {
            return i;
        }
    }
};