/**
 * Copyright (c) 1998-2020 Oracle NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
 * you entered into with NetSuite.
 *
 * Module Description
 * SafetyCulture Pty - Map Reduce - automatically run a Saved Search, create CSV file, and send to the SFTP directory.
 *
 * Version          Date                    Author              Remarks
 * 1.00             22 March 2021           kduque              Initial version
 * 1.01             19 April 2021           kduque              add Content Groups Column for CSV
 *
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/sftp', './lib/NSUtilvSS2'],
/**
 * @param {file} file
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {sftp} sftp
 * @param {NSUtil} NSUtil
 */
function(file, record, runtime, search, sftp, NSUtil) {

    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */

    function getInputData() {
        var objScript = runtime.getCurrentScript();

        //NSCS : Retrieve Employee for Sending to Coupa
        var SEARCH_ID = objScript.getParameter({
            name: 'custscript_ps_mr_saved_search'
        });

        // var empSearch = search.load({
        //    id: SEARCH_ID
        // });
        // var searchResult = empSearch.run().getRange({
        //   start   : 0,
        //   end     : 1000
        // });
        var options =  {
            id : SEARCH_ID
        }

        var searchResult = NSUtil.searchAll(options);

        var importIds = createCSV(searchResult);

        log.debug('importIds', importIds);

        return importIds;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */

    function map(context) {

        var objValuesId =  JSON.parse(context.value);

        try{
            record.submitFields({
                type: record.Type.EMPLOYEE,
                id: objValuesId,
                values: {
                    custentity_sc_send_to_coupa: false
                }
            });
        }catch(ex){
            var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
            log.error('updateEmp', 'Error encountered while updating ' + '. Error: ' + errorStr);
        }

        // context.write({
        //     key: context.key,
        //     value: context.value
        // });
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        //log.debug("reduce context");
/*        log.debug("reduce context");

        log.debug("context.key[0]", context.key[0]);
        log.debug("context.values[0]", context.values[0]);

        var objValuesId = context.values[0];

        try{
            record.submitFields({
                type: record.Type.EMPLOYEE,
                id: objValuesId,
                values: {
                    custentity_sc_send_to_coupa: false
                }
            });
        }catch(ex){
            var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
            log.error('updateEmp', 'Error encountered while updating ' + '. Error: ' + errorStr);
        }*/
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

    }

    //Create CSV File
    function createCSV(searchResult){

        var objScript = runtime.getCurrentScript();

        var CSV_FOLDER_ID = objScript.getParameter({
            name: 'custscript_ps_mr_folder'
        });
        var FILE_PREFIX = objScript.getParameter({
            name: 'custscript_ps_mr_file_prefix'
        });
        var FILE_FORMAT = objScript.getParameter({
            name: 'custscript_ps_mr_file_extension'
        });
        var CSV_HEADER = objScript.getParameter({
            name: 'custscript_nscs_csv_header'
        });

        var isSendToSftpSuccess = false;
        var csvLines = '';
        var importIds = [];
        var csvHeader = CSV_HEADER + '\r\n';

        var defaultCurrency = "";
        var userRoleName = "";

        try{
            for(var i=0; i < searchResult.length; i++){

                var internalId              = searchResult[i].getValue('internalId');
                var coupaId                 = searchResult[i].getValue('custentity_coupa_id');
                var login                   = searchResult[i].getValue('email');
                var status                  = searchResult[i].getText('employeestatus');
                var chkExpUser              = searchResult[i].getValue('custentity_coupa_expense_user');
                var authMethod              = searchResult[i].getText('custentity_nscs_coupa_auth_method');
                var ssoIdentifier           = searchResult[i].getValue('email');
                var chkGenPassNotify        = searchResult[i].getValue('custentity_nscs_coupa_gen_pass_not_user');
                var email                   = searchResult[i].getValue('email');
                var firstName               = searchResult[i].getValue('firstname');
                var lastName                = searchResult[i].getValue('lastname');
                var empNumber               = searchResult[i].getValue('internalId');
                var expApproval             = searchResult[i].getValue('custentity_nscs_coupa_exp_approval_limit');
                var approverLogin           = searchResult[i].getValue('custentity_nscs_supervisor_email');
                var defaultChartOfAccount   = searchResult[i].getText('subsidiarynohierarchy');
                var defaultAccCodeSeg_1     = searchResult[i].getValue('subsidiary');
                var defaultAccCodeSeg_2     = searchResult[i].getValue('department');
                var defaultAccCodeSeg_5     = searchResult[i].getValue('location');
                var userRoleNames           = searchResult[i].getText('custentity_sc_coupa_user_type');
                var defaultExpenseCurrency  = searchResult[i].getText('defaultexpensereportcurrency');
                var defaultLocale           = searchResult[i].getText('custentity_nscs_coupa_def_locale');
                var countryCode             = searchResult[i].getValue('custentity_nscs_country_code');
                var contentGroups           = searchResult[i].getText('subsidiarynohierarchy');

                var mentionName             = firstName + " " + lastName;
                var mentionNameConcat       = mentionName.split(' ').join('.');

                var currency                = searchResult[i].getText('currency');
                var statusLC                = status !== "" ? status.toLowerCase() : "active";

                if(!NSUtil.isEmpty(defaultExpenseCurrency)){
                    defaultCurrency = defaultExpenseCurrency;
                } else {
                    defaultCurrency = currency;
                }
                log.debug('defaultCurrency', defaultCurrency);

                if(userRoleNames.indexOf(',') > -1) {
                    userRoleName = '"'+userRoleNames+'"';
                } else {
                    userRoleName = userRoleNames;
                }

                //log.debug('internalId', internalId);
                log.debug('coupaId', coupaId);
                log.debug('login', login);
                log.debug('statusLC', statusLC);
                log.debug('chkExpUser', chkExpUser);
                log.debug('authMethod', authMethod);
                log.debug('ssoIdentifier', ssoIdentifier);
                log.debug('chkGenPassNotify', chkGenPassNotify);
                log.debug('email', email);
                log.debug('firstName', firstName);
                log.debug('lastName', lastName);
                log.debug('empNumber', empNumber);
                log.debug('expApproval', expApproval + " " + defaultCurrency);
                log.debug('approverLogin', approverLogin);
                log.debug('defaultChartOfAccount', defaultChartOfAccount);
                log.debug('defaultAccCodeSeg_1', defaultAccCodeSeg_1);
                log.debug('defaultAccCodeSeg_2', defaultAccCodeSeg_2);
                log.debug('defaultAccCodeSeg_5', defaultAccCodeSeg_5);
                log.debug('userRoleName', userRoleName);
                log.debug('defaultCurrency', defaultCurrency);
                log.debug('defaultLocale', defaultLocale);
                log.debug('countryCode', countryCode);
                log.debug('contentGroups', contentGroups);
                log.debug('mentionNameConcat', mentionNameConcat);

                var expApprovalWithCurrency = expApproval + " " + defaultCurrency;

                //Add to CSV lines
                //csvLines+= internalId + ',';
                csvLines+= coupaId + ',';
                csvLines+= login + ',';
                csvLines+= statusLC + ',';
                csvLines+= chkExpUser + ',';
                csvLines+= authMethod + ',';
                csvLines+= ssoIdentifier + ',';
                csvLines+= chkGenPassNotify + ',';
                csvLines+= email + ',';
                csvLines+= firstName + ',';
                csvLines+= lastName + ',';
                csvLines+= empNumber + ',';
                csvLines+= expApprovalWithCurrency + ',';
                csvLines+= approverLogin + ',';
                csvLines+= defaultChartOfAccount + ',';
                csvLines+= defaultAccCodeSeg_1 + ',';
                csvLines+= defaultAccCodeSeg_2 + ',';
                csvLines+= defaultAccCodeSeg_5 + ',';
                csvLines+= userRoleName + ',';
                csvLines+= defaultCurrency + ',';
                csvLines+= defaultLocale + ',';
                csvLines+= countryCode + ',';
                csvLines+= contentGroups + ',';
                csvLines+= mentionNameConcat + '\r\n';

                //Save custom record Id
                importIds.push(internalId);
            }

            log.debug('csvLines', csvLines);

            if (!NSUtil.isEmpty(csvLines) && !NSUtil.isEmpty(importIds)) {
                var csvContents = csvHeader + csvLines;

                //Create CSV File
                var stDateTime = new Date().getTime();
                var stCSVFileName = FILE_PREFIX + stDateTime + FILE_FORMAT;

                log.debug('stCsvFileName', stCSVFileName);

                var csvFile = file.create({
                    name: stCSVFileName,
                    fileType: file.Type.PLAINTEXT,
                    contents: csvContents,
                    encoding: file.Encoding.UTF_8,
                    folder: CSV_FOLDER_ID
                });

                var fileId = csvFile.save();
                log.debug('fileId', 'fileId=' + fileId);

                if (!NSUtil.isEmpty(fileId) && !NSUtil.isEmpty(csvFile)){
                    //Send to SFTP
                    sendToSFTP(csvFile);

                    isSendToSftpSuccess = sendToSFTP(csvFile);
                }
            }

        }catch(ex){
            var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
            log.error('execute', 'Error encountered while composing CSV lines. Error: ' + errorStr);
        }

        log.audit("GetInputData send To SFTP Success?", isSendToSftpSuccess);

        if (isSendToSftpSuccess){
            log.audit('isSendToSftpSuccess', isSendToSftpSuccess);

            return importIds;
        }
    }

    //sending to Coupa sFTP Server
    function sendToSFTP(objFile){
        var isUploadSuccess = false;

        var objScript = runtime.getCurrentScript();

        var configId = objScript.getParameter({
            name: 'custscript_ps_sftp_config' // setup in Custom Company Preference
        });

        try{
            var configRec = record.load({
                type: 'customrecord_ps_sftp_config',
                id: configId
            });

        }catch(ex){
            var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
            log.error('createFile', 'Error encountered while getting SFTP Configuration ' + configId + '. Error: ' + errorStr);
        }

        if (!NSUtil.isEmpty(configRec)){

            var sftpUser = configRec.getValue({
                fieldId: 'custrecord_sc_user'
            });
            var sftpGUID = configRec.getValue({
                fieldId: 'custrecord_sc_sftp_guid'
            });
            var sftpServer = configRec.getValue({
                fieldId: 'custrecord_sc_server'
            });
            var sftpDir = configRec.getValue({
                fieldId: 'custrecord_sc_directory'
            });
            var portNbr = configRec.getValue({
                fieldId: 'custrecord_sc_port'
            });
            var hostKey = configRec.getValue({
                fieldId: 'custrecord_sc_host_key'
            });
            log.debug('configRec', sftpUser + '; ' + sftpGUID + '; ' + sftpServer + '; ' + sftpDir + '; portNbr=' + portNbr);

            try{
                var connection = sftp.createConnection({
                    username: sftpUser,
                    passwordGuid: sftpGUID,
                    url: sftpServer,
                    hostKey: hostKey,
                    port: parseInt(portNbr)
                });

                if (connection){

                    log.audit('connection', 'Connection to sFTP server successful. ' + JSON.stringify(connection));

                    connection.upload({
                        directory: sftpDir,
                        filename: objFile.name,
                        file: objFile,
                        replaceExisting: true
                    });

                    isUploadSuccess = true;

                }

            }catch(ex){
                var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
                log.error('createFile', 'Error encountered while pushing file to sFTP. Error: ' + errorStr);

                isUploadSuccess = false;
            }

            return isUploadSuccess;
        }
    }


    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        //summarize: summarize
    };

});
