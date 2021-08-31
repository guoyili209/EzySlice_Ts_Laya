namespace EzySlice {
    import Vector2 = Laya.Vector2;
    /**
     * TextureRegion defines a region of a specific texture which can be used
     * for custom UV Mapping Routines.
     * 
     * TextureRegions are always stored in normalized UV Coordinate space between
     * 0.0f and 1.0f
     */
    export class TextureRegion {
        private pos_start_x: number;
        private pos_start_y: number;
        private pos_end_x: number;
        private pos_end_y: number;

        constructor(startX: number, startY: number, endX: number, endY: number) {
            this.pos_start_x = startX;
            this.pos_start_y = startY;
            this.pos_end_x = endX;
            this.pos_end_y = endY;
        }

        public get startX(): number { return this.pos_start_x; }
        public get startY(): number { return this.pos_start_y; }
        public get endX(): number { return this.pos_end_x; }
        public get endY(): number { return this.pos_end_y; }

        public get start(): Vector2 { return new Vector2(this.startX, this.startY); }
        public get end(): Vector2 { return new Vector2(this.endX, this.endY); }

        /**
         * Perform a mapping of a UV coordinate (computed in 0,1 space)
         * into the new coordinates defined by the provided TextureRegion
         */
        public Map(uv: Vector2): Vector2;

        /**
         * Perform a mapping of a UV coordinate (computed in 0,1 space)
         * into the new coordinates defined by the provided TextureRegion
         */
        public Map(x: number, y: number): Vector2;
        public Map(x: number | Vector2, y?: number): Vector2 {
            if (x instanceof Vector2) {
                return this.Map(x.x, x.y);
            } else if (typeof x == 'number') {
                let mappedX: number = TextureRegion.MAP(x, 0.0, 1.0, this.pos_start_x, this.pos_end_x);
                let mappedY: number = TextureRegion.MAP(y, 0.0, 1.0, this.pos_start_y, this.pos_end_y);
                return new Vector2(mappedX, mappedY);
            }
            return Vector2.ZERO;
        }

        /**
         * Our mapping function to map arbitrary values into our required texture region
         */
        private static MAP(x: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
            return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }
    }
}
