<template>
<div class="h-100 d-flex align-items-center justify-content-center">

    <div class="card" v-if="!triplesec_ciphertext_ready">
        <div class="card-header">
            MIIC System
        </div>
        <div class="card-body">
            <div v-if="!ciphertext_loaded">
                Currently no ciphertext configured.<p />
                You may <a href="./generate.html" target="_blank">create one</a>.
            </div>
            <div v-else>
                <input class="form-control" type="password" v-model="master_password" />
                <button type="button" class="btn btn-primary" @click="on_masterpassword">Enter</button>
            </div>
        </div>
    </div>

    <div v-else-if="!result">

        <div v-for="qa in qa_list">
            <div>{{ qa.question }}</div>
            <div><input class="form-control" type="text" v-model="qa.answer" /></div>
        </div>

        <div>
            <button class="btn btn-primary" @click="on_decrypt">Decrypt</button>
        </div>

    </div>

    <div v-else>
        <pre>{{ result }}</pre>
    </div>


</div>
</template>
<script>
import triplesec from "triplesec/browser/triplesec.js";
import * as openpgp from "openpgp";
import qa_to_key from "app/qa_to_key";

async function load_ciphertext(){
    let res = await fetch("./ciphertext.txt");
    return await res.text();
}


async function decrypt_triplesec(qa, ciphertext, on_progress){
    let triplesec_key = qa_to_key(qa);

    let triplesec_decrypted = await new Promise((resolve, reject)=>{
        triplesec.decrypt({
            data: triplesec.Buffer.from(ciphertext, "base64"),
            key:  triplesec.Buffer.from(triplesec_key, "ascii"),
            progress_hook: on_progress,
        }, (err, buff)=>{
            if(err) return reject(err);
            resolve(buff);
        });
    });

    return triplesec_decrypted;
}


export default {
    async mounted(){
        try{
            let ciphertext = await load_ciphertext();
            let pgpmessage = await openpgp.readMessage({
                armoredMessage: ciphertext,
            });
            this.encrypted_pgpmessage = pgpmessage;
            this.ciphertext_loaded = true;
        } catch(e){
        }
    },
    data(){ return {
        ciphertext_loaded: false,
        encrypted_pgpmessage: null,

        master_password: "",

        qa_list: [],
        triplesec_ciphertext_b64: "",
        triplesec_ciphertext_ready: false,

        result: "",
    }},
    methods: {
        async on_masterpassword(){
            try{
                let decrypted = await openpgp.decrypt({
                    message: this.encrypted_pgpmessage,
                    passwords: [this.master_password],
                });
                console.log(decrypted.data);
                let payload = JSON.parse(decrypted.data);
                this.qa_list = payload.q.map(
                    (q)=>{return { question: q, answer: ""}});
                this.triplesec_ciphertext_b64 = payload.m;
                this.triplesec_ciphertext_ready = true;
            } catch(e){
                this.triplesec_ciphertext_ready = false;
            }
        },

        async on_decrypt(){
            try{
                let result = await decrypt_triplesec(
                    this.qa_list,
                    this.triplesec_ciphertext_b64,
                    function({ what, i, total }){
                        console.log(what, i, total);
                    }
                );
                this.result = result;
            } catch(e){
                this.result = "";
                
            }
        }
    }
}
</script>