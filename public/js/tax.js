let tax =document.getElementById("flexSwitchCheckDefault");
    tax.addEventListener("click", ()=>{
        let taxInfo = document.getElementsByClassName("tax-info");

        for(info of taxInfo){
            if(info.style.display!="inline"){
                info.style.display="inline";
            }
            info.style.display="none";
        }
    });