export default {
  migrations:[
    {
      v: 0,
      up: () => {
        return {
          layout: 1,
          refresh_wait: 1000,
          auto_refresh: false,
        };
      }
    },
  ],
}