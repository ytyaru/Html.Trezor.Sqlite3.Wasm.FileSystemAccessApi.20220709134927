class Sqlite3DbFile { // FileSystemAccess API は Chromeでしか使えない
    #dirHandle = null
    constructor() {
        //this.PATH_WASM = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.7.0`
        this.PATH_WASM = `lib/sql.js/1.7.0`
        //this.name = 'users.db'
    }
    //get DirHandle() { return this.#dirHandle }
    async write(name) {
        const dirHandle = await this.#getDirectoryPicker()
        if (!dirHandle) return
        try {
            const fileHandle = await dirHandle.getFileHandle(name, {
                create: true,
            })
            const writable = await fileHandle.createWritable()
            await writable.write(this.db.export())
            await writable.close()
        } catch (e) {
            console.error(e)
        }
    }
    async read(name) {
        const dirHandle = await this.#getDirectoryPicker()
        if (!dirHandle) { return }
        console.debug(dirHandle)
        const fileHandle = await dirHandle.getFileHandle(name)
        const file = await fileHandle.getFile()
        const arrayBuffer = await file.arrayBuffer()
        const dbAsUint8Array = new Uint8Array(arrayBuffer)
        //const SQL = await initSQL(this.PATH_WASM)
        if (!this.SQL) {
            //this.SQL = await initSqlJs({locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`})
            this.SQL = await initSqlJs({locateFile: file => `${this.PATH_WASM}/${file}`})
        }
        //await this.SQL()
        this.db = new this.SQL.Database(dbAsUint8Array)

        //document.getElementById(`update`).disabled = false

        return this.db
    }
    /*
    async SQL() {
        if (!this.SQL) {
            //this.SQL = await initSqlJs({locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`})
            this.SQL = await initSqlJs({locateFile: file => `${this.PATH_WASM}/${file}`})
        }
        return this.SQL
    }
    */
    async #getDirectoryPicker() {
        if (this.#dirHandle) { return this.#dirHandle }
        try {
            this.#dirHandle = await window.showDirectoryPicker()
            return this.#dirHandle
        } catch (e) {
            console.error(e)
        }
    }
}
