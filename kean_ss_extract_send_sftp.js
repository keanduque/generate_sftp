/**
 *
 * Module Description
 * Scheduled Script - automatically run a Saved Search, create CSV file, and send to the SFTP directory.
 *
 * Version          Date                    Author              Remarks
 * 1.00             05 March 2021             kduque              Initial version
 *
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
define(['N/record',
        'N/runtime',
        'N/sftp',
        'N/search',
        'N/file',
        './lib/NSUtilvSS2'],
    /**
     * @param {record} record
     * @param {runtime} runtime
     * @param {sftp} sftp
     * @param {search} search
     * @param {file} task
     * @param {NSUtil} NSUtil
     */
    function(record,
             runtime,
             sftp,
             search,
             file,
             NSUtil) {

        var objScript = runtime.getCurrentScript();

        //NSCS : Retrieve Employee for Sending to Coupa
        var SEARCH_ID = objScript.getParameter({
            name: 'custscript_ps_saved_search'
        });
        var CSV_FOLDER_ID = objScript.getParameter({
            name: 'custscript_ps_folder'
        });
        var FILE_PREFIX = objScript.getParameter({
            name: 'custscript_ps_file_prefix'
        });
        var FILE_FORMAT = objScript.getParameter({
            name: 'custscript_ps_file_extension'
        });

        /**
         * Definition of the Scheduled script trigger point.
         *
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
         * @Since 2015.2
         */
        function execute(context) {

            var csvLines = '';
            var importIds = [];
            var csvHeader = 'Internal ID,Employee ID,Login Access,Employee Status,First Name,Last Name,Email,Send To Coupa,Coupa User Type\r\n';

            try{
                var empSearch = search.load({
                    id: SEARCH_ID
                });

                var searchResult = empSearch.run().getRange({
                    start   : 0,
                    end     : 1000
                });

                for(var i=0; i < searchResult.length; i++){

                    var internalId 	            = searchResult[i].getValue('internalid');
                    var empId                   = searchResult[i].getValue('entityid');
                    var loginAccess             = searchResult[i].getValue('giveaccess');
                    var empStatus               = searchResult[i].getValue('employeestatus');
                    var firstName 	            = searchResult[i].getValue('firstname');
                    var lastName                = searchResult[i].getValue('lastname');
                    var email                   = searchResult[i].getValue('email');
                    var chkSendToCoupa          = searchResult[i].getValue('custentity_sc_send_to_coupa');
                    var coupaUserType           = searchResult[i].getValue('custentity_sc_coupa_user_type');

                    log.debug('internalId', internalId);
                    log.debug('empId', empId);
                    log.debug('loginAccess', loginAccess);
                    log.debug('empStatus', empStatus);
                    log.debug('firstName', firstName);
                    log.debug('lastName', lastName);
                    log.debug('email', email);
                    log.debug('chkSendToCoupa', chkSendToCoupa);
                    log.debug('coupaUserType', coupaUserType);

                    //Add to CSV lines
                    csvLines+= internalId + ',';
                    csvLines+= empId + ',';
                    csvLines+= loginAccess + ',';
                    csvLines+= empStatus + ',';
                    csvLines+= firstName + ',';
                    csvLines+= lastName + ',';
                    csvLines+= email + ',';
                    csvLines+= chkSendToCoupa + ',';
                    csvLines+= coupaUserType + '\r\n';

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
                    }
                }

            }catch(ex){
                var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
                log.error('execute', 'Error encountered while composing CSV lines. Error: ' + errorStr);
            }
        }

        //sending to Coupa sFTP Server
        function sendToSFTP(objFile){

            var objScript = runtime.getCurrentScript();

            var configId = objScript.getParameter({
                name: 'custscript_ps_sftp_config'
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

                    log.debug('connection LOG', connection);

                    if (connection){

                        log.audit('connection', 'Connection to sFTP server successful. ' + JSON.stringify(connection));

                        connection.upload({
                            directory: sftpDir,
                            filename: objFile.name,
                            file: objFile,
                            replaceExisting: true
                        });

                    }

                }catch(ex){
                    var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
                    log.error('createFile', 'Error encountered while pushing file to sFTP. Error: ' + errorStr);
                }
            }
        }

        return {
            execute: execute
        };

    });
