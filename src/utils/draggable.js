export function makeDraggable(gameObject, vat23, vat8, vat5, matchedCallback, scene){
    gameObject.setInteractive();

    function onDrag(pointer){
        gameObject.x = pointer.x;
        gameObject.y = pointer.y;
    }
    
    function stopDrag(){
        
        const bounds23 = vat23.getBounds();
        const isInArea23 = Phaser.Geom.Intersects.RectangleToRectangle(gameObject.getBounds(), bounds23);

        const bounds8 = vat8.getBounds();
        const isInArea8 = Phaser.Geom.Intersects.RectangleToRectangle(gameObject.getBounds(), bounds8);

        const bounds5 = vat5.getBounds();
        const isInArea5 = Phaser.Geom.Intersects.RectangleToRectangle(gameObject.getBounds(), bounds5);

        if(isInArea23){
            if(vat23.products.includes(gameObject.name)){
                gameObject.x = vat23.x;
                gameObject.y = vat23.y;
                destroy();
                matchedCallback();
                return;
            }
            else{
                scene.addTime(5000);
                resetPosition();
            }
        }
        else if(isInArea8){
            if(vat8.products.includes(gameObject.name)){
                gameObject.x = vat8.x;
                gameObject.y = vat8.y;
                destroy();
                matchedCallback();
                return;
            }
            else{
                resetPosition();
            }
        }
        else if(isInArea5){
            if(vat5.products.includes(gameObject.name)){
                gameObject.x = vat5.x;
                gameObject.y = vat5.y;
                destroy();
                matchedCallback();
                return;
            }
            else{
                resetPosition();
            }
        }
        else{
            resetPosition();
        }

        gameObject.on(Phaser.Input.Events.POINTER_DOWN, startDrag);
        gameObject.off(Phaser.Input.Events.POINTER_UP, stopDrag);
        gameObject.off(Phaser.Input.Events.POINTER_MOVE, onDrag);
    }

    function startDrag(){
        gameObject.off(Phaser.Input.Events.POINTER_DOWN, startDrag);
        gameObject.on(Phaser.Input.Events.POINTER_UP, stopDrag);
        gameObject.on(Phaser.Input.Events.POINTER_MOVE, onDrag);
    }

    function destroy(){
        gameObject.off(Phaser.Input.Events.POINTER_DOWN, startDrag);
        gameObject.off(Phaser.Input.Events.POINTER_UP, stopDrag);
        gameObject.off(Phaser.Input.Events.POINTER_MOVE, onDrag);
    }
    function resetPosition(){
        gameObject.x = gameObject.xHome;
        gameObject.y = gameObject.yHome;
    }

    gameObject.on(Phaser.Input.Events.POINTER_DOWN, startDrag);
    gameObject.on(Phaser.GameObjects.Events.DESTROY, destroy);
}