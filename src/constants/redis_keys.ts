const redisQueryKeys = {
    USER: {
        BY_ID: (id: string) => `USER:BY_ID:${id}`,
        BY_EMAIL: (email: string) => `USER:BY_EMAIL:${email}`,
    },
    ORGANIZATION: {
        BY_ID: (id: string) => `ORGANIZATION:BY_ID:${id}`,
    },
}

const redisQueryExpireTime = {
    ONE_HOUR: 60 * 60,
    ONE_DAY: 60 * 60 * 24,
    ONE_WEEK: 60 * 60 * 24 * 7,
    NO_EXPIRE: -1,
}

export { redisQueryExpireTime, redisQueryKeys };

