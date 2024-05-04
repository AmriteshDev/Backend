
const asyncHandler = (requestHandler) => {                     //  requestHandler === fun
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) =>
                next(err)
            )
    }
}

export { asyncHandler }









// const asyncHandler = () => { }
// const asyncHandler = (fun) => { () => { } }             // Heigher order function
// const asyncHandler = (fun) => async () => { }

// const asyncHandler = (fun) => async (req, res, next) => {
//     try {
//         await fun(req, res, next)
//     }
//     catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

