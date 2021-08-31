namespace EzySlice {
    import Vector3 = Laya.Vector3;
    export class Line {
        private readonly m_pos_a: Vector3;
        private readonly m_pos_b: Vector3;
        constructor(pta: Vector3, ptb: Vector3) {
            this.m_pos_a = pta;
            this.m_pos_b = ptb;
        }
        get dist(): number {
            return Vector3.distance(this.m_pos_a, this.m_pos_b);
        }
        get distSq(): number {
            return Vector3.distanceSquared(this.m_pos_a, this.m_pos_b);
        }

        get positionA(): Vector3 {
            return this.m_pos_a;
        }
        get positionB(): Vector3 {
            return this.m_pos_b;
        }
    }
}