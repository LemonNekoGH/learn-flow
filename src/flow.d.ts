declare module '@onflow/fcl' {
  export { config, logIn, signUp, currentUser, unauthenticate, query, mutate, authz, tx, withPrefix, account }
}

declare module '@onflow/sdk' {
  export { getAccount, build, pipe, resolveArguments, resolveParams, send, decode, script, args }
}

declare module '@onflow/types' {
  export { Int, String }
}
