export default {
    addTodo({
        commit
    }, text) {
        commit('addTodo', {
            text,
            done: false
        })
    },
}