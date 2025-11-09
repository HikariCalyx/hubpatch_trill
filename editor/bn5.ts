import type { Editor as EditorBase } from "./index";

interface GameInfo {
    region: "US" | "JP";
    version: "protoman" | "colonel";
}

const SRAM_START_OFFSET = 0x0100;
const SRAM_SIZE = 0x7c14;
const MASK_OFFSET = 0x1a34;
const GAME_NAME_OFFSET = 0x29e0;
const CHECKSUM_OFFSET = 0x29dc;

function maskSave(dv: DataView) {
    const mask = dv.getUint32(MASK_OFFSET, true);
    const unmasked = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    for (let i = 0; i < unmasked.length; ++i) {
        unmasked[i] = (unmasked[i] ^ mask) & 0xff;
    }
    // Write the mask back.
    dv.setUint32(MASK_OFFSET, mask, true);
}

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

const CHECKSUM_START: { [key: string]: number } = {
    protoman: 0x72,
    colonel: 0x18,
};

const GAME_INFOS_BY_SAVE_GAME_NAME: { [key: string]: GameInfo } = {
    "REXE5TOB 20041006 US": {
        region: "US",
        version: "protoman",
    },
    "REXE5TOK 20041006 US": {
        region: "US",
        version: "colonel",
    },
    "REXE5TOB 20041104 JP": {
        region: "JP",
        version: "protoman",
    },
    "REXE5TOK 20041104 JP": {
        region: "JP",
        version: "colonel",
    },
};

const PATCH_CARD_INFOS = [
    { name: "小矮兵", nameJa: "メットール", mb: 7 },
    { name: "火山齿轮", nameJa: "ボルケルギア", mb: 12 },
    { name: "鬼斯拉", nameJa: "ゴースラー", mb: 15 },
    { name: "剑兵", nameJa: "スウォーディン", mb: 10 },
    { name: "急行鸟", nameJa: "キオルシン", mb: 18 },
    { name: "胡闹男孩", nameJa: "アーバルボーイ", mb: 10 },
    { name: "鼠顿", nameJa: "チュートン", mb: 10 },
    { name: "霹力", nameJa: "ビリー", mb: 5 },
    { name: "蜡烛恶魔", nameJa: "キャンデービル", mb: 9 },
    { name: "带蛇", nameJa: "ダイジャン", mb: 12 },
    { name: "荼蘑菇", nameJa: "チャマッシュ", mb: 15 },
    { name: "吠狼", nameJa: "ガルー", mb: 6 },
    { name: "罗勒甘草", nameJa: "バジリコ", mb: 16 },
    { name: "溜溜艇", nameJa: "ヨーヨット", mb: 17 },
    { name: "诅咒面", nameJa: "カーズ", mb: 18 },
    { name: "湿怪", nameJa: "ヌール", mb: 13 },
    { name: "笔郎", nameJa: "フデロー", mb: 19 },
    { name: "梦幻位元", nameJa: "ドリームビット", mb: 20 },
    { name: "吸哈怪", nameJa: "スーンハーク", mb: 17 },
    { name: "杀手之眼", nameJa: "キラーズアイ", mb: 21 },
    { name: "地震客", nameJa: "クエイカー", mb: 15 },
    { name: "回转手", nameJa: "ラウンダ", mb: 18 },
    { name: "盖拉克", nameJa: "ゲイラーク", mb: 17 },
    { name: "绒绒圆", nameJa: "マルモコ", mb: 5 },
    { name: "抖抖梅罗", nameJa: "プルメロ", mb: 15 },
    { name: "左卫门", nameJa: "ザエモン", mb: 20 },
    { name: "卡坦克", nameJa: "キャタック", mb: 20 },
    { name: "强普尔", nameJa: "チャンプル", mb: 15 },
    { name: "节奏涡蟹", nameJa: "ウズリム", mb: 20 },
    { name: "仙人掌可伦", nameJa: "サボテコロン", mb: 16 },
    { name: "萝露", nameJa: "ロール", mb: 40 },
    { name: "气力人", nameJa: "ガッツマン", mb: 35 },
    { name: "火焰人", nameJa: "ファイアマン", mb: 43 },
    { name: "佛鲁迪", nameJa: "フォルテ", mb: 45 },
    { name: "快速人", nameJa: "クイックマン", mb: 38 },
    { name: "蛇人", nameJa: "スネークマン", mb: 40 },
    { name: "泡沫人", nameJa: "バブルマン", mb: 37 },
    { name: "烈焰人", nameJa: "フレイムマン", mb: 45 },
    { name: "金属人", nameJa: "メタルマン", mb: 46 },
    { name: "阴暗人", nameJa: "シェードマン", mb: 43 },
    { name: "火花人", nameJa: "スパークマン", mb: 43 },
    { name: "废铁人", nameJa: "ジャンクマン", mb: 40 },
    { name: "旋翼人", nameJa: "ジャイロマン", mb: 45 },
    { name: "梅蒂", nameJa: "メディ", mb: 45 },
    { name: "宇宙人", nameJa: "コスモマン", mb: 44 },
    { name: "炎山的改装", nameJa: "炎山のカスタマイズ", mb: 35 },
    { name: "火健的改装", nameJa: "ヒノケンのカスタマイズ", mb: 35 },
    { name: "电力伯爵的改装", nameJa: "エレキ伯爵のカスタマイズ", mb: 35 },
    { name: "亚奈妲的改装", nameJa: "アネッタのカスタマイズ", mb: 47 },
    { name: "高李斯基的改装", nameJa: "コオリスキーのカスタマイズ", mb: 47 },
    { name: "甲虫坦克", nameJa: "カブタンク", mb: 7 },
    { name: "漂浮砝码", nameJa: "ポワルド", mb: 10 },
    { name: "铁壁壳", nameJa: "フロシェル", mb: 16 },
    { name: "坚硬炮座", nameJa: "ハルドボルズ", mb: 10 },
    { name: "云包伞", nameJa: "クモンペ", mb: 10 },
    { name: "盖亚巨人", nameJa: "ガイアント", mb: 15 },
    { name: "线捆虫", nameJa: "ミノゴロモン", mb: 20 },
    { name: "扇风机", nameJa: "ファンカー", mb: 15 },
    { name: "刺血蚊", nameJa: "チクリート", mb: 18 },
    { name: "莱西", nameJa: "ラッシュ", mb: 11 },
    { name: "线圈兔", nameJa: "ラビリー", mb: 8 },
    { name: "飞焰爆", nameJa: "フレイボー", mb: 20 },
    { name: "虾龙", nameJa: "エビロン", mb: 10 },
    { name: "UFO珊妮", nameJa: "UFOサニー", mb: 20 },
    { name: "下忍", nameJa: "ゲニン", mb: 18 },
    { name: "岩浆龙", nameJa: "マグマドラゴン", mb: 20 },
    { name: "防护", nameJa: "プロテクト", mb: 23 },
    { name: "特钢炮", nameJa: "ドゴーン", mb: 20 },
    { name: "冰企鹅", nameJa: "コリペン", mb: 18 },
    { name: "火花蜂", nameJa: "スパークビー", mb: 20 },
    { name: "原型BUG", nameJa: "プロトバグ", mb: 16 },
    { name: "N.O", nameJa: "N.O", mb: 13 },
    { name: "麻痹球", nameJa: "パラボール", mb: 14 },
    { name: "达玛", nameJa: "ダーマ", mb: 22 },
    { name: "天气士", nameJa: "ウェザース", mb: 19 },
    { name: "神灯", nameJa: "エレンプラ", mb: 20 },
    { name: "搜奇拉", nameJa: "サーキラー", mb: 18 },
    { name: "钻克罗尔", nameJa: "ドリクロール", mb: 17 },
    { name: "脉冲蝙蝠", nameJa: "パルスバット", mb: 25 },
    { name: "苹果山姆", nameJa: "アップルサム", mb: 24 },
    { name: "木头人", nameJa: "ウッドマン", mb: 45 },
    { name: "电力人", nameJa: "エレキマン", mb: 35 },
    { name: "布鲁斯", nameJa: "ブルース", mb: 45 },
    { name: "炸弹人", nameJa: "ボンバーマン", mb: 43 },
    { name: "魔术人", nameJa: "マジックマン", mb: 44 },
    { name: "高热人", nameJa: "ヒートマン", mb: 45 },
    { name: "闸门人", nameJa: "ゲートマン", mb: 46 },
    { name: "闪光人", nameJa: "フラッシュマン", mb: 46 },
    { name: "钻头人", nameJa: "ドリルマン", mb: 47 },
    { name: "国王人", nameJa: "キングマン", mb: 45 },
    { name: "水人", nameJa: "アクアマン", mb: 40 },
    { name: "风人", nameJa: "ウインドマン", mb: 46 },
    { name: "雷射人", nameJa: "レーザーマン", mb: 47 },
    { name: "卡尼尔", nameJa: "カーネル", mb: 42 },
    { name: "战斧人", nameJa: "トマホークマン", mb: 40 },
    { name: "热斗的改装", nameJa: "熱斗のカスタマイズ", mb: 25 },
    { name: "迪卡欧的改装", nameJa: "デカオのカスタマイズ", mb: 40 },
    { name: "惑的改装", nameJa: "まどいのカスタマイズ", mb: 5 },
    { name: "曼哈·杰拉玛的BUG修正", nameJa: "マハ･ジャラマのバグ修正", mb: 17 },
    { name: "虎吉的战术", nameJa: "虎吉の戦術", mb: 64 },
    { name: "梦幻病毒", nameJa: "梦幻病毒", mb: 55 },
    { name: "戈斯巴鲁", nameJa: "ゴスペル", mb: 60 },
    { name: "赛雷纳德", nameJa: "セレナード", mb: 50 },
    { name: "原型", nameJa: "プロト", mb: 55 },
    { name: "佛鲁迪GS", nameJa: "フォルテGS", mb: 59 },
    { name: "迪欧", nameJa: "デューオ", mb: 70 },
    { name: "佛鲁迪 XX", nameJa: "フォルテXX", mb: 70 },
    { name: "星云灰暗", nameJa: "ネビュラグレイ", mb: 70 },
    { name: "爸爸的修正程序", nameJa: "爸爸的修正程序", mb: 50 },
    { name: "光 彩斗", nameJa: "光 彩斗", mb: 80 },
    { name: "佛鲁迪交错洛克人", nameJa: "フォルテクロス", mb: 70 },
];

export class Editor implements EditorBase {
    dv: DataView;
    gameInfo: GameInfo;

    static NAME = "bn5";

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
            !Object.prototype.hasOwnProperty.call(
                GAME_INFOS_BY_SAVE_GAME_NAME,
                gn
            )
        ) {
            throw "unknown game name: " + gn;
        }

        if (
            getChecksum(this.dv) !=
            computeChecksum(this.dv, GAME_INFOS_BY_SAVE_GAME_NAME[gn].version)
        ) {
            throw "checksum mismatch";
        }

        this.gameInfo = GAME_INFOS_BY_SAVE_GAME_NAME[gn];
    }

    computeChecksum() {
        return computeChecksum(this.dv, this.gameInfo.version);
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
        return this.dv.getUint8(0x79a0);
    }

    setPatchCardCount(n: number) {
        this.dv.setUint8(0x79a0, n);
    }

    getPatchCardInfos() {
        return PATCH_CARD_INFOS;
    }

    getPatchCard(i: number) {
        if (i >= this.getPatchCardCount()) {
            return null;
        }

        const c = this.dv.getUint8(0x79d0 + i);
        return {
            id: c & 0x7f,
            enabled: !(c >> 7),
        };
    }

    setPatchCard(i: number, id: number, enabled: boolean) {
        this.dv.setUint8(0x79d0 + i, id | ((enabled ? 0 : 1) << 7));
    }

    setPatchCardLoaded(id: number, loaded: boolean) {
        this.dv.setUint8(
            0x60dc + id,
            this.dv.getUint8(0x1220 + id) ^
                (loaded
                    ? {
                          colonel: 0x8d,
                          protoman: 0x43,
                      }[this.gameInfo.version]
                    : 0xff)
        );
    }
}
