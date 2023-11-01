export const http = {
    post(url: string, body: any) {
        return fetch(new URL(url), {
            method: "POST",
            mode: "no-cors",
            referrerPolicy: "no-referrer", 
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(body)
          });
    },
    delete(url: string, body: any) {
        return fetch(new URL(url), {
            method: "DELETE",
            mode: "no-cors",
            referrerPolicy: "no-referrer", 
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(body)
          });
    },
    get(url: string) {
        return fetch(new URL(url));
    }
};