export default function(qa_list){
    let answers = qa_list.map((e)=>e.answer).map((a)=>{
    return a
        .trim()
        .toLowerCase()
        .replace(/[^0-9a-z]/g, " ")
        .split(" ")
        .filter((e)=>e!="")
        .join(" ");
    });
    return answers.join("|");
}