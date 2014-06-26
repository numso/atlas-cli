Atlas
=====

He who holds your server on his back!

##Install

##CLI Commands

atlas help - shows a help screen
atlas config - ability to add new servers and new domains on servers
atlas addServer - put in server IP, put in server token
atlas addDomain - choose server, enter domain name
atlas addKey - way to add new ssh keys, or something to authenticate to github

atlas list - show list of servers, domains and subdomains
atlas list servers
atlas list domains
atlas list <server>
atlas list <domain>

atlas push - choose server, domain, subdomain. Possibly get key for git. Pushes info, including git url, to server to set up node <need a cool name here :)>.

atlas remove - choose server, domain, subdomain, confirm.

##Notes2

Serverside:
  Keep folder structure as such:
  /opt
   |- <url> (i.e. dallinosmun.com or editor.huespectrum.com)
        |- project (git clone url project)
        |- restart script
        |- manifest.json to keep track of any info (include git url, port number, etc)

##Notes

Server
------
 - Store domains, subs, ports, gits
 - add subdomains
 - remove subdomains
 - update
 - import/export
choose port
add nginx record
restart nginx
git pull
npm install
forever npm start
setup restart script
setup githook to restart on update
store info

CLI
---
1. config
2. domain
3. add/push -- err on exists
4. remove
5. refresh/restart
6. help
7. list
