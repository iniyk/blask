# Blask Documents

本文档用以部署并配置Blask及其所依赖的集群

## Steps Overview

Blask需要同时部署Hadoop、Hbase、Spark，并使用Thrift作为Hbase的访问接口，为了便于配置和伸缩，还需要一台bind9服务器提供DNS和反向DNS服务。应用层使用Node.js构建。应用层服务端采用Express.js框架，并使用了若干常用npm包用以简化工作，这些依赖的包会由npm包管理器自动下载，如果需要部署的计算机没有互联网，这里也会提供离线部署的方法。

由于Spark是内存计算模型，对服务器的内存存在一定要求，低内存配置的集群可以勉强运行这个应用，但是可能会出现意想不到的情况。
最低配置如下：

节点								| 内存		|
------------------------------|---------|
所有集群节点 						| 额外保留1Gb供系统使用 |
HDFS DataNode:					| 4Gb		|
MapReduce NodeManager:			| 2Gb		|
Hbase Region Server:			| 6Gb		|
Spark Master and Worker:		| 8Gb		|
Node.js Server:					| 1Gb		|
	
有条件的话，这些服务应该是完全分开的，但这样规模的集群如果难以找到的话，可以如下部署集群：

节点	| 数量 | 内存		| 服务		|
--------|-----|-----|---------|
Web and backup Master | 1 | 8Gb | Blask Web App / HMaster / Secondary NameNode / Spark Master / Resource Manager / Thrift |
Master | 1 | 8Gb | Blask Connector / HMaster / NameNode / Spark Master / Resource Manager / Thrift |
Spark Worker | 3 | 8Gb |  Blask Connector / Spark Worker |
Data and Region Server| 3 | 8Gb | DataNode / ResgionServer |
Managers | 3 | 2Gb | Zookeeper / NodeManager / Bind(一台） |

## Bind9 Server

对于集群中的每台计算机建议配置好各自的域名、hostname及反向域名解析，如果规模不大且无伸缩需求，可以考虑直接修改每一台的`/etc/host`文件，但不推荐此方法，尤其可能造成Hbase的RegionServer无法识别的问题。

Bind9一般ubuntu server发行版自带，如果没有安装的话可以使用`sudo apt-get install bind9`直接安装。

Bind9的配置文件默认在`/etc/bind/`下，首先需要在文件`named.conf.local`新增解析域，示例配置如下：

> named.conf.local

```
//
// Do any local configuration here
//

// Consider adding the 1918 zones here, if they are not used in your
// organization
//include "/etc/bind/zones.rfc1918";

zone "hadark.clt" {
    type master;
    file "/etc/bind/db.hadark.zone";
};

zone "1.168.172.in-addr.arpa" {
    type master;
    file "/etc/bind/db.1.168.172.zone";
};
```

其中`hadark.clt`为DNS域，`1.168.172`是反向DNS域，注意反向DNS是反着的，必须以`.in-addr.arpa`结束。

下面需要两个域配置文件`db.hadark.zone``db.1.168.172.zone`，示例如下:


> db.hadark.zone

```
$TTL 604800
@       IN      SOA         hahark.clt. admin.email.box. (
                        2016010811          ; Serial
                                1H          ; Refresh
                               15M          ; Retry
                                1W          ; Expire
                                1D )        ; Negative Cache TTL
;
            IN      NS      hadark.clt.
            IN      A       172.168.1.201
master      IN      A       172.168.1.201
slave1      IN      A       172.168.1.202
slave2      IN      A       172.168.1.203
slave3      IN      A       172.168.1.204
slave4      IN      A       172.168.1.205
```

> db.1.168.172.zone

```
$TTL    604800
@       IN      SOA     hadark.clt. iniykfrost.outlook.com. (
                        2016010822         ; Serial
                                3H         ; Refresh
                               15M         ; Retry
                                1W         ; Expire
                                1D )       ; Negative Cache TTL
;
		IN      NS      hadark.clt.
201   	IN      PTR     master.hadark.clt.   ;DO NOT lose this dot
202 	IN	    PTR	    slave1.hadark.clt.
203 	IN	    PTR	    slave2.hadark.clt.
204 	IN	    PTR	    slave3.hadark.clt.
205 	IN	    PTR	    slave4.hadark.clt.

```

配置所有机器的`dns-nameservers`为该台服务器：修改`/etc/network/inferfaces`如下：

```
auto lo
iface lo inet loopback

atuo eth0
iface eth0 inet static
	address 172.168.1.201
	netmask 255.255.255.0
	gateway 172.168.1.1
	dns-nameservers 172.168.1.1
```

修改每一台机器的`/etc/hostname`为其域名，并执行

```sh
sudo hostname -F /etc/hostname
```

最后检查`/etc/host`中的配置，确保仅有`127.0.0.1 localhost`这一条本地记录。

检查Bind9配置完成的方式是使用nslookup命令，测试命令如下：

```sh
> nslookup 172.168.1.201
Server:							172.168.1.1
Address:						172.168.1.1#53

201.1.168.172.in-addr.arpa		name = master.hadark.clt.
# Domain name arpa service success

> nslookup master.hadark.clt
Server:							172.168.1.1
Address:						172.168.1.1#53

Name:	master.hadark.clt
Address:	172.168.1.201
# Domain name service success
```

## Hadoop Cluster

![Hadoop Logo] (./hadoop-logo.jpg)

### ssh免密钥登录

Hadoop首先需要配置ssh免密码登陆，需要在每一台机器上生成公私玥对，并收集所有的公钥存放于每一台机器的`~/.ssh/authorized_keys`下。

生成密钥对需要openssh，一般ubuntu发行版默认已安装，如果未安装可以使用以下命令安装：

```sh
sudo apt-get install openssh-server
```

在所有机器上使用以下命令生成公私玥对：

```sh
ssh-keygen
```

一路回车（不要设置二次密钥），而后会在`~/.ssh/`文件夹下保存着该次生成的密钥对，将所有的`~/.ssh/id_rsa.pub`收集并每行一个保存在名为`authorized_keys`的文件中，再分别发送到每一台机器的`~/.ssh/`目录下。尝试其中两台互相ssh登陆，成功即代表配置完成。

### Java安装

![Java Logo] (./java-logo.jpg)

在[这个页面] (http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)下载jdk-8u65-linux-x64.tar.gz（或其它对应的版本），不建议下载rpm版本，很多系统上这个版本并不完善。

将下载的jdk包在希望安装的地方解压（`tar -xzvf jdk-8u65-linux-x64.tar.gz`）,并依次设置`JAVA_HOME` `JRE_HOME` `CLASS_PATH`及`PATH`，示例如下：

```sh
JAVA_HOME=/usr/java/jdk1.8.0_65
JRE_HOME=/usr/java/jdk1.8.0_65/jre
PATH=$PATH:$JAVA_HOME/bin:$JRE_HOME/bin
CLASSPATH=:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JRE_HOME/lib

export JAVA_HOME JRE_HOME PATH CLASSPATH
```

如果实在bashrc或者其它shell的启动脚本中设置，最后执行`source ~/.bashrc`（或其它rc脚本文件）来立刻导入路径。

执行`java`检查安装情况，某些情况下（例如你一意孤行坚持使用rpm包安装），会有些pack文件未解压成为jar包，此时需要使用jdk中自带的unpack工具进行解压，示例如下：

> unpack_jar.sh

```sh
#!/bin/sh
cd /usr/java/jdk1.8.0_65/lib
../bin/unpack200 tools.pack tools.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 deploy.pack deploy.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 rt.pack rt.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 ext/localedata.pack ext/localedata.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 ext/jfxrt.pack ext/jfxrt.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 charsets.pack charsets.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 jsse.pack jsse.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 javaws.pack javaws.jar
cd /usr/java/jdk1.8.0_65/jre/lib
../bin/unpack200 plugin.pack plugin.jar
```

### Scala安装

![Scala Logo] (./scala-logo.gif)

在Spark 1.6.0的官方文档中声明需要Scala的2.10.X版本，建议下载[Scala 2.10.6] (http://www.scala-lang.org/download/2.10.6.html)，或者根据官方文档的建议，在Scala的最新版本中重新编译Spark。

解压下载的Scala安装包，设置`SCALA_HOME`，并加入`PATH`，在终端运行`scala`以测试安装是否正确。

### 安装配置Hadoop

[下载] (https://hadoop.apache.org/releases.html)最新Release版的Hadoop并解压。其中一共有7个文件需要配置：

配置文件 | 描述 |
--------|------|
hadoop-env.sh | Hadoop启动环境配置脚本 |
yarn-env.sh | Yarn启动环境配置脚本 |
core-site.xml | 基本配置 |
hdfs-site.xml | HDFS配置 |
maprd-site.xml | 分布式任务分配模型配置 |
yarn-site.xml | Yarn框架配置 |
slaves | slave节点配置 |

对于`hadoop-env.sh`及`yarn-env.sh`只需要修改其中的`JAVA_HOME`项使其指向Java安装目录即可。其它配置文件示例如下：

> core-site.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<!--
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License. See accompanying LICENSE file.
-->

<!-- Put site-specific property overrides in this file. -->

<configuration>
    <property>
        <name>hadoop.tmp.dir</name>
        <value>/home/jury/hadoop/tmp</value>
    </property>
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://master.hadark.clt:9000</value>
    </property>
    <property>
        <name>io.file.buffer.size</name>
        <value>131072</value>
    </property>
    <property>
        <name>hadoop.proxyuser.hue.hosts</name>
        <value>*</value>
    </property>
    <property>
        <name>hadoop.proxyuser.hue.groups</name>
        <value>*</value>
    </property>
</configuration>

```

> hdfs-site.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<!--
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License. See accompanying LICENSE file.
-->

<!-- Put site-specific property overrides in this file. -->

<configuration>
    <property>
        <name>dfs.namenode.name.dir</name>
        <value>/home/jury/hadoop_dfs/name</value>
    </property>
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>/home/jury/hadoop_dfs/data</value>
    </property>
    <property>
        <name>dfs.replication</name>
        <value>2</value>
    </property>
    <property>
        <name>dfs.namenode.secondary.http-address</name>
        <value>master.hadark.clt:9001</value>
    </property>
    <property>
        <name>dfs.webhdfs.enabled</name>
        <value>true</value>
    </property>
    <property>
        <name>dfs.datanode.dns.interface</name>
        <value>eth0</value>
    </property>
    <property>
        <name>dfs.datanode.dns.nameserver</name>
        <value>172.168.1.200</value>
    </property>
</configuration>

```

> maprd-site.xml

```xml
<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<!--
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License. See accompanying LICENSE file.
-->

<!-- Put site-specific property overrides in this file. -->

<configuration>
   <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
</configuration>

```

> yarn-site.xml

```xml
<?xml version="1.0"?>
<!--
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License. See accompanying LICENSE file.
-->
<configuration>

<!-- Site specific YARN configuration properties -->
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <property>
        <name>yarn.nodemanager.auxservices.mapreduce.shuffle.class</name>
        <value>org.apache.hadoop.mapred.ShuffleHandler</value>
    </property>
    <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>master.hadark.clt</value>
    </property>
    <property>
        <name>yarn.resourcemanager.address</name>
        <value>master.hadark.clt:8032</value>
    </property>
    <property>
        <name>yarn.resourcemanager.scheduler.address</name>
        <value>master.hadark.clt:8030</value>
    </property>
    <property>
        <name>yarn.resourcemanager.resource-tracker.address</name>
        <value>master.hadark.clt:8031</value>
    </property>
    <property>
        <name>yarn.resourcemanager.admin.address</name>
        <value>master.hadark.clt:8033</value>
    </property>
    <property>
        <name>yarn.resourcemanager.webapp.address</name>
        <value>master.hadark.clt:8088</value>
    </property>
    <property>
        <name>yarn.nodemanager.resource.memory-mb</name>
        <value>512</value>
    </property>
    <property>
        <name>yarn.scheduler.minimum-allocation-mb</name>
        <value>512</value>
    </property>
</configuration>

```

> slaves

```
slave1.hadark.clt
slave2.hadark.clt

```

## Hbase Cluster

## Spark Cluster

## Compile and install Thrift

## Install Node.js

## Blask install and setup