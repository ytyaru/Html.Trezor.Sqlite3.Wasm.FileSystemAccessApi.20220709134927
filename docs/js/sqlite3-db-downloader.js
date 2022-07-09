class Sqlite3DbDownloader {
    constructor(sqlFile, dbs, my) {
        this.SQL = null
        this.sqlFile = sqlFile
        this.dbs = dbs // dexies.js
        this.my = my // 対象アドレス
    }
    async download(ext='db') {
        Loading.show()
        this.zip = new JSZip()
        const content = await this.#makeDb()
        this.zip.file(`${this.my}.${ext}`, content)
        //this.#makeHtmlFiles(files)
        //await Promise.all([this.#makeHtmlFiles(), this.#makeJsFiles(), this.#makeImageFiles()])
        const file = await this.zip.generateAsync({type:'blob', platform:this.#getOs()})
        const url = (window.URL || window.webkitURL).createObjectURL(file);
        const download = document.createElement('a');
        download.href = url;
        download.download = `${name}.zip`;
        download.click();
        (window.URL || window.webkitURL).revokeObjectURL(url);
        Loading.hide()
        Toaster.toast(`ZIPファイルをダウンロードしました！`)
    }
    #getOs() {
        var ua = window.navigator.userAgent.toLowerCase();
        if (ua.indexOf("windows nt") !== -1) { return 'DOS' }
        return 'UNIX'
    }
    async #makeDb() {
        if (!this.SQL) {
            //this.SQL = await initSqlJs({locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`})
            //this.SQL = await initSqlJs({locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.7.0/${file}`})
            this.SQL = await initSqlJs({locateFile: file => `lib/sql.js/1.7.0/${file}`})
        }
        const db = new this.SQL.Database();
        db.exec(`BEGIN;`)
        await this.#makeTableLast(db)
        await this.#makeTableSendPartners(db)
        await this.#makeTableReceivePartners(db)
        await this.#makeTableTransactions(db)
        /*
        let res = JSON.stringify(db.exec("SELECT sqlite_version();"));
        console.debug(res)
        res = JSON.stringify(db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT);`));
        console.debug(res)
        //res = JSON.stringify(db.exec(`.tables`)); // .コマンドは使えなかった
        //console.debug(res)
        const values = document.getElementById('usernames').value.split('\n').filter(v=>v).map(n=>`('${n}')`).join(',')
        res = JSON.stringify(db.exec(`INSERT INTO users(name) VALUES ${values || "('ytyaru')"};`));
        //res = JSON.stringify(db.exec(`INSERT INTO users(name) VALUES ('ytyaru');`));
        console.debug(res)
        res = JSON.stringify(db.exec(`SELECT * FROM users;`));
        console.debug(res)
        */
        db.exec(`COMMIT;`)
        return db.export()
    }
    async #makeTableLast(db) {
        const last = await this.dbs.get(this.my).dexie.last.get(1)
        db.exec(this.#createSqlLast())
        db.exec(`insert into last values (
1,
${last.count},
${last.lastBlockHeight},
'${last.lastTxId}',
${last.sendValue},
${last.receiveValue},
${last.balance},
${last.fee},
${last.unconfirmedBalance},
${last.unconfirmedTxs},
${last.sendCount},
${last.receiveCount},
${last.sendAddressCount},
${last.receiveAddressCount},
${last.bothAddressCount},
${last.firsted},
${last.lasted}
);`)
    }
    async #makeTableSendPartners(db) {
        db.exec(this.#createSqlSendPartners())
        const partners = await this.dbs.get(this.my).dexie.sendPartners.toArray()
        const values = partners.map(p=>`('${p.address}', ${p.value}, ${p.count}, ${p.firsted}, ${p.lasted})`).join(',')
        db.exec(`insert into send_partners values ${values};`)
    }
    async #makeTableReceivePartners(db) {
        db.exec(this.#createSqlReceivePartners())
        const partners = await this.dbs.get(this.my).dexie.receivePartners.toArray()
        const values = partners.map(p=>`('${p.address}', ${p.value}, ${p.count}, ${p.firsted}, ${p.lasted})`).join(',')
        db.exec(`insert into receive_partners values ${values};`)
    }
    async #makeTableTransactions(db) {
        db.exec(this.#createSqlTransactions())
        const txs = await this.dbs.get(this.my).dexie.transactions.toArray()
        for (const tx of txs) {
            db.exec(`insert into transactions values (
'${tx.txid}',
${tx.isPay},
'${tx.addresses}',
${tx.value},
${tx.fee},
${tx.confirmations},
${tx.blockTime},
${tx.blockHeight}
);`)
        }
    }
    #createSqlLast() { return `
create table last (
  id integer primary key,
  count integer,
  last_block_height integer,
  last_txid integer,
  send_value integer,
  receive_value integer,
  balance integer,
  fee integer,
  unconfirmed_balance integer,
  unconfirmed_txs integer,
  send_count integer,
  receive_count integer,
  send_address_count integer,
  receive_address_count integer,
  both_address_count integer,
  firsted integer,
  lasted integer
);`
    }
    #createSqlSendPartners() { return `
create table send_partners (
  address text primary key,
  value integer,
  count integer,
  firsted integer,
  lasted integer
) without rowid;`
    }
    #createSqlReceivePartners() { return `
create table receive_partners (
  address text primary key,
  value integer,
  count integer,
  firsted integer,
  lasted integer
) without rowid;`
    }
    #createSqlTransactions() { return `
create table transactions (
  txid text primary key,
  is_send integer,
  addresses text,
  value integer,
  fee integer,
  confirmations integer,
  block_time integer,
  block_height integer
) without rowid;`
    }
}
