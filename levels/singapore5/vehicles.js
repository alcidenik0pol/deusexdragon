export class Singapore5Vehicles {
    constructor(scene) {
        this.scene = scene;
        this.vehicles = [];
        this.flyingCar = null;
    }

    async createVehicles() {
        await this.createFlyingCar();
    }

    async createFlyingCar() {
        const carModel = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "assets/raw/car/",
            "car03.glb",
            this.scene
        );
        
        const car = carModel.meshes[0];
        car.position = new BABYLON.Vector3(-80, 67.5, -50);
        car.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        car.scaling = new BABYLON.Vector3(2.0, 2.0, 2.0);
        
        this.flyingCar = {
            mesh: car,
            speed: 1.0,
            startX: -80,
            endX: 80
        };
        this.vehicles.push(car);
    }

    updateVehicles() {
        this.updateFlyingCar();
    }

    updateFlyingCar() {
        if (!this.flyingCar) return;
        
        this.flyingCar.mesh.position.x += this.flyingCar.speed;
        
        if (this.flyingCar.mesh.position.x > this.flyingCar.endX) {
            this.flyingCar.mesh.position.x = this.flyingCar.startX;
        }
    }

    dispose() {
        this.vehicles.forEach(vehicle => {
            vehicle.dispose();
        });
        this.vehicles = [];
        this.flyingCar = null;
    }
} 