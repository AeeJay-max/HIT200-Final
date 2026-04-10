"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const auditLog_model_1 = require("../models/auditLog.model");
const logAction = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield auditLog_model_1.AuditLogModel.create(Object.assign(Object.assign({}, params), { timestamp: new Date() }));
    }
    catch (error) {
        console.error("Failed to create audit log:", error);
    }
});
exports.logAction = logAction;
