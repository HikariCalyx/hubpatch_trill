import type { Editor as EditorBase } from "./index";

const SRAM_START_OFFSET = 0x0100;
const SRAM_SIZE = 0x6710;
const MASK_OFFSET = 0x1064;
const GAME_NAME_OFFSET = 0x1c70;
const CHECKSUM_OFFSET = 0x1c6c;

function getChecksum(dv: DataView) {
    return dv.getUint32(CHECKSUM_OFFSET, true);
}

function computeChecksum(dv: DataView, version: string) {
    let checksum = CHECKSUM_START[version];
    const arr = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    for (let i = 0; i < arr.length; ++i) {
        if (i == CHECKSUM_OFFSET) {
            // Don't include the checksum itself in the checksum.
            i += 3;
            continue;
        }
        checksum += arr[i];
    }
    return checksum;
}

function maskSave(dv: DataView) {
    const mask = dv.getUint32(MASK_OFFSET, true);
    const unmasked = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    for (let i = 0; i < unmasked.length; ++i) {
        // We only actually need to use the first byte of the mask, even though it's 32 bits long.
        unmasked[i] = (unmasked[i] ^ mask) & 0xff;
    }
    // Write the mask back.
    dv.setUint32(MASK_OFFSET, mask, true);
}

const PATCH_CARD_INFOS = [
    { name: "加农炮塔", nameJa: "キャノーダム", mb: 10 },
    { name: "泡泡蟹", nameJa: "アモナキュール", mb: 16 },
    { name: "冻熊", nameJa: "コルドベア", mb: 18 },
    { name: "地雷熊", nameJa: "ジーラ", mb: 12 },
    { name: "石脑", nameJa: "メガリア", mb: 20 },
    { name: "陨石法师", nameJa: "メテファイア", mb: 20 },
    { name: "树种花", nameJa: "キルプラント", mb: 19 },
    { name: "剑影", nameJa: "ダークシャドー", mb: 6 },
    { name: "破地战车", nameJa: "ボンビートル", mb: 11 },
    { name: "重哑铃", nameJa: "ヘビーアレイ", mb: 15 },
    { name: "洋葱藤", nameJa: "アゾマータ", mb: 24 },
    { name: "占地果冻", nameJa: "ジェライム", mb: 12 },
    { name: "火山炮", nameJa: "ボルカノ", mb: 10 },
    { name: "序号柱", nameJa: "ナンバーズ", mb: 17 },
    { name: "磁力虫", nameJa: "マグテクト", mb: 15 },
    { name: "木蜘蛛", nameJa: "クーモス", mb: 8 },
    { name: "炸弹小子", nameJa: "ボムボーイ", mb: 14 },
    { name: "长鼻草", nameJa: "ウドノート", mb: 13 },
    { name: "电灯泡", nameJa: "ピカラー", mb: 11 },
    { name: "电气鬼", nameJa: "エレオーガ", mb: 16 },
    { name: "火炉", nameJa: "ダルスト", mb: 12 },
    { name: "刺球鱼", nameJa: "センボン", mb: 11 },
    { name: "海星", nameJa: "ヒトデスタ", mb: 15 },
    { name: "墨镜怪", nameJa: "グラサン", mb: 8 },
    { name: "稻草偶", nameJa: "カカジー", mb: 14 },
    { name: "小飞机", nameJa: "ゼロプレーン", mb: 20 },
    { name: "石人像", nameJa: "レムゴン", mb: 19 },
    { name: "穿山鼠", nameJa: "アルマン", mb: 12 },
    { name: "沸水壶", nameJa: "ヤカーン", mb: 15 },
    { name: "壶龙", nameJa: "ツボリュウ", mb: 20 },
    { name: "数字人", nameJa: "ナンバーマン", mb: 35 },
    { name: "冰冻人", nameJa: "アイスマン", mb: 25 },
    { name: "骷髅人", nameJa: "スカルマン", mb: 30 },
    { name: "影子人", nameJa: "シャドーマン", mb: 38 },
    { name: "剪刀人", nameJa: "カットマン", mb: 32 },
    { name: "骑士人", nameJa: "ナイトマン", mb: 45 },
    { name: "蟾蜍人", nameJa: "トードマン", mb: 34 },
    { name: "磁力人", nameJa: "マグネットマン", mb: 37 },
    { name: "行星人", nameJa: "プラネットマン", mb: 40 },
    { name: "野兽人", nameJa: "ビーストマン", mb: 33 },
    { name: "沙漠人", nameJa: "デザートマン", mb: 36 },
    { name: "大和人", nameJa: "ヤマトマン", mb: 35 },
    { name: "影像人", nameJa: "ビデオマン", mb: 32 },
    { name: "燃烧人", nameJa: "バーナーマン", mb: 29 },
    { name: "星星人", nameJa: "スターマン", mb: 32 },
    { name: "暴雪人", nameJa: "ブリザードマン", mb: 30 },
    { name: "燕子人", nameJa: "スワローマン", mb: 36 },
    { name: "切裂人", nameJa: "スラッシュマン", mb: 31 },
    { name: "杀手人", nameJa: "キラーマン", mb: 40 },
    { name: "大地人", nameJa: "グランドマン", mb: 43 },
    { name: "垃圾人", nameJa: "ダストマン", mb: 37 },
    { name: "爆炎人", nameJa: "ブラストマン", mb: 28 },
    { name: "马戏人", nameJa: "サーカスマン", mb: 43 },
    { name: "炸弹手套", nameJa: "ハンディース", mb: 16 },
    { name: "散弹河豚", nameJa: "プクール", mb: 12 },
    { name: "海浪水母", nameJa: "ジェリー", mb: 13 },
    { name: "淤泥包", nameJa: "ポイットン", mb: 13 },
    { name: "人工卫星", nameJa: "サテラ", mb: 8 },
    { name: "召雷机", nameJa: "パララ＆リモコゴロー", mb: 9 },
    { name: "摇摆电球", nameJa: "ユラ", mb: 8 },
    { name: "泡泡章鱼", nameJa: "タコバル", mb: 14 },
    { name: "弓箭贝", nameJa: "シェルキー", mb: 8 },
    { name: "磁力蟋蟀", nameJa: "マグニッカー", mb: 7 },
    { name: "陨石巫师", nameJa: "メテマージ", mb: 15 },
    { name: "挖地鼠", nameJa: "モモグラン", mb: 6 },
    { name: "针刺机器", nameJa: "ニドキャスター", mb: 10 },
    { name: "双子星", nameJa: "ツインズ", mb: 15 },
    { name: "飞牙海狮", nameJa: "ウォーラ", mb: 12 },
    { name: "侧面竹", nameJa: "キルブー", mb: 24 },
    { name: "火图腾", nameJa: "トトポール", mb: 13 },
    { name: "封闭炮塔", nameJa: "キャノガード", mb: 10 },
    { name: "骷髅骨", nameJa: "スカラビア", mb: 7 },
    { name: "火圈海马", nameJa: "ドラグリン", mb: 11 },
    { name: "潜水艇", nameJa: "マリーナ", mb: 14 },
    { name: "烛台", nameJa: "ドルダーラ", mb: 12 },
    { name: "机枪炮塔", nameJa: "ガンナー", mb: 11 },
    { name: "电箱", nameJa: "パルフォロン", mb: 13 },
    { name: "爆爆玉米", nameJa: "ボムコーン", mb: 16 },
    { name: "草堆球", nameJa: "モリキュー", mb: 6 },
    { name: "蜂巢", nameJa: "ハニホー", mb: 12 },
    { name: "梦魇", nameJa: "ナイトメア", mb: 5 },
    { name: "沙地虫", nameJa: "スナーム", mb: 11 },
    { name: "暗杀机器", nameJa: "アサシンメカ", mb: 22 },
    { name: "石头人", nameJa: "ストーンマン", mb: 45 },
    { name: "彩色人", nameJa: "カラードマン", mb: 32 },
    { name: "鲨鱼人", nameJa: "シャークマン", mb: 35 },
    { name: "法老人", nameJa: "ファラオマン", mb: 35 },
    { name: "空气人", nameJa: "エアーマン", mb: 34 },
    { name: "冻结人", nameJa: "フリーズマン", mb: 30 },
    { name: "闪电人", nameJa: "サンダーマン", mb: 36 },
    { name: "汽油人", nameJa: "ナパームマン", mb: 39 },
    { name: "旋花人", nameJa: "プラントマン", mb: 42 },
    { name: "迷雾人", nameJa: "ミストマン", mb: 37 },
    { name: "保龄人", nameJa: "ボウルマン", mb: 30 },
    { name: "黑暗人", nameJa: "ダークマン", mb: 25 },
    { name: "陀螺人", nameJa: "タップマン", mb: 28 },
    { name: "剑道人", nameJa: "ケンドーマン", mb: 38 },
    { name: "寒冷人", nameJa: "コールドマン", mb: 34 },
    { name: "检索人", nameJa: "サーチマン", mb: 37 },
    { name: "巨云人", nameJa: "クラウドマン", mb: 40 },
    { name: "榄球人", nameJa: "フットマン", mb: 48 },
    { name: "火车人", nameJa: "チャージマン", mb: 31 },
    { name: "天狗人", nameJa: "テングマン", mb: 34 },
    { name: "潜水人", nameJa: "ダイブマン", mb: 42 },
    { name: "审判人", nameJa: "ジャッジマン", mb: 38 },
    { name: "元素人", nameJa: "エレメントマン", mb: 33 },
    { name: "庞克", nameJa: "パンク", mb: 50 },
    { name: "黑暗洛克人", nameJa: "ダークロックマン", mb: 80 },
    { name: "灵魂斗士改装", nameJa: "ソウルバトラーのカスタマイズ", mb: 66 },
    { name: "名人超绝改装", nameJa: "名人の超絶カスタマイズ", mb: 69 },
    { name: "佛鲁迪BX", nameJa: "フォルテＢＸ", mb: 70 },
    { name: "强戈", nameJa: "ジャンゴ", mb: 52 },
    { name: "伯爵", nameJa: "伯爵", mb: 60 },
    { name: "洛克人ZERO", nameJa: "ロックマンゼロ", mb: 45 },
    { name: "电脑兽麒麟", nameJa: "電脳獣グレイガ", mb: 70 },
    { name: "电脑兽凤凰", nameJa: "電脳獣ファルザー", mb: 70 },
    { name: "佛鲁迪共鸣洛克人", nameJa: "フォルテクロスロックマン", mb: 70 },
];

const CHECKSUM_START: { [key: string]: number } = {
    falzar: 0x18,
    gregar: 0x72,
};

const VERSION_BY_SAVE_GAME_NAME: { [key: string]: string } = {
    "REXE6 F 20050924a JP": "falzar",
    "REXE6 G 20050924a JP": "gregar",
};

export class Editor implements EditorBase {
    dv: DataView;
    version: string;

    static NAME = "bn6";

    constructor(buffer: ArrayBuffer) {
        buffer = buffer.slice(SRAM_START_OFFSET, SRAM_START_OFFSET + SRAM_SIZE);
        maskSave(new DataView(buffer));
        this.dv = new DataView(buffer);

        const decoder = new TextDecoder("ascii");
        const gn = decoder.decode(
            new Uint8Array(
                this.dv.buffer,
                this.dv.byteOffset + GAME_NAME_OFFSET,
                20
            )
        );
        if (
            !Object.prototype.hasOwnProperty.call(VERSION_BY_SAVE_GAME_NAME, gn)
        ) {
            throw "unknown game name: " + gn;
        }

        if (
            getChecksum(this.dv) !=
            computeChecksum(this.dv, VERSION_BY_SAVE_GAME_NAME[gn])
        ) {
            throw "checksum mismatch";
        }

        this.version = VERSION_BY_SAVE_GAME_NAME[gn];
    }

    computeChecksum() {
        return computeChecksum(this.dv, this.version);
    }

    rebuild() {
        this.rebuildPatchCardsLoaded();
        this.rebuildChecksum();
    }

    export() {
        this.rebuild();
        const arr = new Uint8Array(0x10000);
        arr.set(new Uint8Array(this.dv.buffer), SRAM_START_OFFSET);
        maskSave(new DataView(arr.buffer, SRAM_START_OFFSET, SRAM_SIZE));
        return arr.buffer;
    }

    getChecksum() {
        return getChecksum(this.dv);
    }

    rebuildPatchCardsLoaded() {
        for (let i = 0; i < this.getPatchCardCount(); ++i) {
            this.setPatchCardLoaded(this.getPatchCard(i)!.id, true);
        }
    }

    rebuildChecksum() {
        return this.dv.setUint32(CHECKSUM_OFFSET, this.computeChecksum(), true);
    }

    getPatchCardCount() {
        return this.dv.getUint8(0x65f0);
    }

    setPatchCardCount(n: number) {
        this.dv.setUint8(0x65f0, n);
    }

    getPatchCardInfos() {
        return PATCH_CARD_INFOS;
    }

    getPatchCard(i: number) {
        if (i >= this.getPatchCardCount()) {
            return null;
        }

        const c = this.dv.getUint8(0x6620 + i);
        return {
            id: c & 0x7f,
            enabled: !(c >> 7),
        };
    }

    setPatchCard(i: number, id: number, enabled: boolean) {
        this.dv.setUint8(0x6620 + i, id | ((enabled ? 0 : 1) << 7));
    }

    setPatchCardLoaded(id: number, loaded: boolean) {
        this.dv.setUint8(
            0x5048 + id,
            this.dv.getUint8(0x06c0 + id) ^
                (loaded
                    ? {
                          falzar: 0x8d,
                          gregar: 0x43,
                      }[this.version]
                    : 0xff)
        );
    }
}
