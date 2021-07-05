/*
Returns an index that is empty in `arr` array.
If there are no empty indexes, it will return arr.length
*/
module.exports = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == null) {
            return i;
        }
    }
    return arr.length;
};