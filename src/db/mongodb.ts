import { MongoClient, Collection, Db } from 'mongodb';
import { config } from 'dotenv';

config();

const env = process.env.ENV || 'dev';
console.log(`MongoDB Environment is ${env}`);

const CLUSTER = new MongoClient(process.env[`MONGODB_${env.toUpperCase()}`] || '');

export class MongoDB {
  private _DB: Db | null = null;

  constructor() {
    if (env === "prod") {
      this._DB = CLUSTER.db("zenox");
    } else {
      this._DB = CLUSTER.db(`zenox_${env}`);
    }
  }

  get guilds(): Collection {
    // Stores config for all guilds
    return this._DB!.collection("guilds");
  }

  get users(): Collection {
    // Stores config for all users
    return this._DB!.collection("users");
  }

  get const(): Collection {
    // Stores information about bot growth
    return this._DB!.collection("const");
  }
}

export class HoyoverseDB {
  private _DB: Db | null = null;

  constructor() {
    if (env === "prod") {
      this._DB = CLUSTER.db("hoyoverseDB");
    } else {
      this._DB = CLUSTER.db(`hoyoverseDB_${env}`);
    }
  }

  get event_reminders(): Collection {
    return this._DB!.collection("event_reminders");
  }

  get special_programs(): Collection {
    return this._DB!.collection("special_programs");
  }

  get codes(): Collection {
    return this._DB!.collection("codes");
  }
}

export class AnalyticsDB {
  private _DB: Db | null = null;

  constructor() {
    if (env === "prod") {
      this._DB = CLUSTER.db("analytics");
    } else {
      this._DB = CLUSTER.db(`analytics_${env}`);
    }
  }

  get reminders(): Collection {
    return this._DB!.collection("reminders");
  }

  get wiki_codes(): Collection {
    return this._DB!.collection("wiki_codes");
  }

  get hoyolab_codes(): Collection {
    return this._DB!.collection("hoyolab_codes");
  }
}

export const DB = new MongoDB();
export const HOYOVERSEDB = new HoyoverseDB();
export const ANALYTICSDB = new AnalyticsDB();