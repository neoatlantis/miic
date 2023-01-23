<template>
<div class="container">

    <div>
        <br />
        <h3>MIIC: Mobile Important Information Center</h3>
        Sometimes I travel to places that are known for not good safety.<p />
        Just in case you unfortunately get stolen or robbed, you might want to
        have quick access to your important information, e.g. bank phone
        numbers for suspending credit cards, etc. You want an online deposit
        that's secure and do not require anything beyond Internet access. If
        you have lost your phone, you cannot receive SMS, or use a TOTP code,
        or press "Yes" for login. That can be a big problematic situation.
        <p />
        This system requires only your knowledge to reveal these information.
        However, instead of a single password, you can configure multiple ones
        to make it both secure and easy to remember.
        <p />
        Additionally, you can configure a master password to protect above
        data (your secure notes, and questions to them) that is printed and
        written somewhere, also hopefully used only once, so that even if your
        page is remembered by Internet forever, no one can decrypt it later.
    </div>

    <p />

    <div>
        <h4>1. Specify your questions and answers</h4>
        <div>
            Your questions may have answers only in alphanumeric characters:
            A-Z and 0-9. Continous spaces and other characters are treated as
            a single space.
            During decryption, expect using a device that cannot type your
            preferred language.
        </div>

        <div>
            <div v-for="(qa, qa_i) in qa_list" class="form-group row">
                <div class="col">
                    <input type="text" class="form-control" v-model="qa.question" placeholder="Question">
                </div>
                <div class="col">
                    <input type="text" class="form-control" v-model="qa.answer" placeholder="Answer">
                </div>
                <div class="col">
                    <button class="btn btn-outline-danger" @click="remove_qa(qa_i)">Delete</button>
                </div>
            </div>
        </div>
        <button class="btn btn-primary" @click="add_qa">Add</button>
    </div>

    <p />

    <div>
        <h4>2. Set your master password</h4>
        <div>
            This master password is used at main entry to this whole page.
            Without this password, nothing is revealed. 
        </div>
        <div>
            <input type="text" class="form-control" v-model="master_password"/>
            <small>Shown in plaintext. Do not use your usual password.</small>
        </div>
    </div>

    <p />

    <div>
        <h4>3. Write or upload your important information</h4>
        <div>
            <textarea class="form-control" rows="10" v-model="payload"></textarea>
        </div>
    </div>

    <p />

    <button class="btn btn-primary" @click="generate">Generate!</button>

    <div v-if="result" style="margin-top: 3em">
        <pre>{{ result }}</pre>
    </div>

    <br />
    <br />

</div>
</template>
<script>
import * as openpgp from "openpgp";
import qa_to_key from "app/qa_to_key";
import triplesec from "triplesec/browser/triplesec.js";


async function generate_ciphertext(qa, master_password, payload, on_progress){
    let questions = qa.map((e)=>e.question);
    let triplesec_key = qa_to_key(qa);

    let triplesec_encrypted = await new Promise((resolve, reject)=>{
        triplesec.encrypt({
            data: triplesec.Buffer.from(payload, "utf-8"),
            key:  triplesec.Buffer.from(triplesec_key, "ascii"),
            progress_hook: on_progress,
        }, (err, buff)=>{
            if(err) return reject(err);
            resolve(buff);
        });
    });

    let pgp_payload = JSON.stringify({
        q: questions,
        m: triplesec_encrypted.toString("base64"),
    })

    
    let pgp_message = await openpgp.createMessage({
        text: pgp_payload,
    });
    let pgp_encrypted = await openpgp.encrypt({
        message: pgp_message,
        passwords: [master_password.toString(),],
    });

    return pgp_encrypted;
}




export default {
    data(){ return {
        qa_list: [],
        master_password: "",
        payload: "",

        result: "",
    } },

    methods: {
        add_qa(){
            this.qa_list.push({ question: "", answer: "" });
        },

        remove_qa(i){
            this.qa_list.splice(i, 1);
        },

        async generate(){
            this.result = await generate_ciphertext(
                this.qa_list,
                this.master_password,
                this.payload,

                this.on_progress,
            );
        },

        on_progress({ what, i, total }){
            console.log(what, i, total);
        }
    }
}
</script>