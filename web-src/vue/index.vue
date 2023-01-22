<template>
<div class="h-100 d-flex align-items-center justify-content-center">

    <div class="card">
        <div class="card-header">
            MIIC System
        </div>
        <div class="card-body">
            <div v-if="!ciphertext_loaded">
                Currently no ciphertext configured.<p />
                You may <a href="./generate.html" target="_blank">create one</a>.
            </div>
        </div>
    </div>


</div>
</template>
<script>
import * as openpgp from "openpgp";

async function load_ciphertext(){
    let res = await fetch("./ciphertext.txt");
    return await res.text();
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
    }}
}
</script>