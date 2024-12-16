

    function addToCart(proId,num){
        
        $.ajax({
            url:'/add-to-cart/'+proId,
            method:'get',
            
            success:(response)=>{
                if(response.status&&response.newlyadded){

                    let count=$('#cart-count').html()
                     count=parseInt(count)+1
                    $("#cart-count").html(count)
                    location.reload()

                }
                
            
            }
        })
    }
 